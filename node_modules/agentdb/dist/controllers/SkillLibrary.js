/**
 * SkillLibrary - Lifelong Learning Skill Management
 *
 * Promotes high-reward trajectories into reusable skills.
 * Manages skill composition, relationships, and adaptive selection.
 *
 * Based on: "Voyager: An Open-Ended Embodied Agent with Large Language Models"
 * https://arxiv.org/abs/2305.16291
 */
export class SkillLibrary {
    db;
    embedder;
    constructor(db, embedder) {
        this.db = db;
        this.embedder = embedder;
    }
    /**
     * Create a new skill manually or from an episode
     */
    async createSkill(skill) {
        const stmt = this.db.prepare(`
      INSERT INTO skills (
        name, description, signature, code, success_rate, uses,
        avg_reward, avg_latency_ms, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(skill.name, skill.description || null, JSON.stringify(skill.signature), skill.code || null, skill.successRate, skill.uses, skill.avgReward, skill.avgLatencyMs, skill.metadata ? JSON.stringify(skill.metadata) : null);
        const skillId = result.lastInsertRowid;
        // Generate and store embedding
        const text = this.buildSkillText(skill);
        const embedding = await this.embedder.embed(text);
        this.storeSkillEmbedding(skillId, embedding);
        return skillId;
    }
    /**
     * Update skill statistics after use
     */
    updateSkillStats(skillId, success, reward, latencyMs) {
        const stmt = this.db.prepare(`
      UPDATE skills
      SET
        uses = uses + 1,
        success_rate = (success_rate * uses + ?) / (uses + 1),
        avg_reward = (avg_reward * uses + ?) / (uses + 1),
        avg_latency_ms = (avg_latency_ms * uses + ?) / (uses + 1)
      WHERE id = ?
    `);
        stmt.run(success ? 1 : 0, reward, latencyMs, skillId);
    }
    /**
     * Retrieve skills relevant to a task
     */
    async searchSkills(query) {
        return this.retrieveSkills(query);
    }
    async retrieveSkills(query) {
        const { task, k = 5, minSuccessRate = 0.5, preferRecent = true } = query;
        // Generate query embedding
        const queryEmbedding = await this.embedder.embed(task);
        // Build filters
        const filters = ['s.success_rate >= ?'];
        const params = [minSuccessRate];
        const stmt = this.db.prepare(`
      SELECT
        s.*,
        se.embedding
      FROM skills s
      JOIN skill_embeddings se ON s.id = se.skill_id
      WHERE ${filters.join(' AND ')}
      ORDER BY ${preferRecent ? 's.last_used_at DESC,' : ''} s.success_rate DESC
    `);
        const rows = stmt.all(...params);
        // Calculate similarities and rank
        const skills = rows.map(row => {
            const embedding = this.deserializeEmbedding(row.embedding);
            const similarity = this.cosineSimilarity(queryEmbedding, embedding);
            return {
                id: row.id,
                name: row.name,
                description: row.description,
                signature: JSON.parse(row.signature),
                code: row.code,
                successRate: row.success_rate,
                uses: row.uses,
                avgReward: row.avg_reward,
                avgLatencyMs: row.avg_latency_ms,
                createdFromEpisode: row.created_from_episode,
                metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
                similarity
            };
        });
        // Compute composite scores
        skills.sort((a, b) => {
            const scoreA = this.computeSkillScore(a);
            const scoreB = this.computeSkillScore(b);
            return scoreB - scoreA;
        });
        return skills.slice(0, k);
    }
    /**
     * Link two skills with a relationship
     */
    linkSkills(link) {
        const stmt = this.db.prepare(`
      INSERT INTO skill_links (parent_skill_id, child_skill_id, relationship, weight, metadata)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(parent_skill_id, child_skill_id, relationship)
      DO UPDATE SET weight = excluded.weight
    `);
        stmt.run(link.parentSkillId, link.childSkillId, link.relationship, link.weight, link.metadata ? JSON.stringify(link.metadata) : null);
    }
    /**
     * Get skill composition plan (prerequisites and alternatives)
     */
    getSkillPlan(skillId) {
        // Get main skill
        const skill = this.getSkillById(skillId);
        // Get prerequisites
        const prereqStmt = this.db.prepare(`
      SELECT s.* FROM skills s
      JOIN skill_links sl ON s.id = sl.child_skill_id
      WHERE sl.parent_skill_id = ? AND sl.relationship = 'prerequisite'
      ORDER BY sl.weight DESC
    `);
        const prerequisites = prereqStmt.all(skillId).map(this.rowToSkill);
        // Get alternatives
        const altStmt = this.db.prepare(`
      SELECT s.* FROM skills s
      JOIN skill_links sl ON s.id = sl.child_skill_id
      WHERE sl.parent_skill_id = ? AND sl.relationship = 'alternative'
      ORDER BY sl.weight DESC, s.success_rate DESC
    `);
        const alternatives = altStmt.all(skillId).map(this.rowToSkill);
        // Get refinements
        const refStmt = this.db.prepare(`
      SELECT s.* FROM skills s
      JOIN skill_links sl ON s.id = sl.child_skill_id
      WHERE sl.parent_skill_id = ? AND sl.relationship = 'refinement'
      ORDER BY sl.weight DESC, s.created_at DESC
    `);
        const refinements = refStmt.all(skillId).map(this.rowToSkill);
        return { skill, prerequisites, alternatives, refinements };
    }
    /**
     * Consolidate high-reward episodes into skills with ML pattern extraction
     * This is the core learning mechanism enhanced with pattern analysis
     */
    async consolidateEpisodesIntoSkills(config) {
        const { minAttempts = 3, minReward = 0.7, timeWindowDays = 7, extractPatterns = true } = config;
        const stmt = this.db.prepare(`
      SELECT
        task,
        COUNT(*) as attempt_count,
        AVG(reward) as avg_reward,
        AVG(success) as success_rate,
        AVG(latency_ms) as avg_latency,
        MAX(id) as latest_episode_id,
        GROUP_CONCAT(id) as episode_ids
      FROM episodes
      WHERE ts > strftime('%s', 'now') - ?
        AND reward >= ?
      GROUP BY task
      HAVING attempt_count >= ?
    `);
        const candidates = stmt.all(timeWindowDays * 86400, minReward, minAttempts);
        let created = 0;
        let updated = 0;
        const patterns = [];
        for (const candidate of candidates) {
            const episodeIds = candidate.episode_ids.split(',').map(Number);
            // Extract patterns from successful episodes if requested
            let extractedPatterns = [];
            let successIndicators = [];
            let enhancedDescription = `Auto-generated skill from successful episodes`;
            if (extractPatterns) {
                const patternData = await this.extractPatternsFromEpisodes(episodeIds);
                extractedPatterns = patternData.commonPatterns;
                successIndicators = patternData.successIndicators;
                if (extractedPatterns.length > 0) {
                    enhancedDescription = `Skill learned from ${episodeIds.length} successful episodes. Common patterns: ${extractedPatterns.slice(0, 3).join(', ')}`;
                }
                patterns.push({
                    task: candidate.task,
                    commonPatterns: extractedPatterns,
                    successIndicators: successIndicators,
                    avgReward: candidate.avg_reward
                });
            }
            // Check if skill already exists
            const existing = this.db.prepare('SELECT id FROM skills WHERE name = ?').get(candidate.task);
            if (!existing) {
                // Create new skill with extracted patterns
                const skill = {
                    name: candidate.task,
                    description: enhancedDescription,
                    signature: {
                        inputs: { task: 'string' },
                        outputs: { result: 'any' }
                    },
                    successRate: candidate.success_rate,
                    uses: candidate.attempt_count,
                    avgReward: candidate.avg_reward,
                    avgLatencyMs: candidate.avg_latency || 0,
                    createdFromEpisode: candidate.latest_episode_id,
                    metadata: {
                        sourceEpisodes: episodeIds,
                        autoGenerated: true,
                        consolidatedAt: Date.now(),
                        extractedPatterns: extractedPatterns,
                        successIndicators: successIndicators,
                        patternConfidence: this.calculatePatternConfidence(episodeIds.length, candidate.success_rate)
                    }
                };
                await this.createSkill(skill);
                created++;
            }
            else {
                // Update existing skill stats
                this.updateSkillStats(existing.id, candidate.success_rate > 0.5, candidate.avg_reward, candidate.avg_latency || 0);
                updated++;
            }
        }
        return { created, updated, patterns };
    }
    /**
     * Extract common patterns from successful episodes using ML-inspired analysis
     */
    async extractPatternsFromEpisodes(episodeIds) {
        // Retrieve episodes with their outputs and critiques
        const episodes = this.db.prepare(`
      SELECT id, task, input, output, critique, reward, success, metadata
      FROM episodes
      WHERE id IN (${episodeIds.map(() => '?').join(',')})
      AND success = 1
    `).all(...episodeIds);
        if (episodes.length === 0) {
            return { commonPatterns: [], successIndicators: [] };
        }
        const commonPatterns = [];
        const successIndicators = [];
        // Pattern 1: Analyze output text for common keywords and phrases
        const outputTexts = episodes
            .map(ep => ep.output)
            .filter(Boolean);
        if (outputTexts.length > 0) {
            const keywordFrequency = this.extractKeywordFrequency(outputTexts);
            const topKeywords = this.getTopKeywords(keywordFrequency, 5);
            if (topKeywords.length > 0) {
                commonPatterns.push(`Common techniques: ${topKeywords.join(', ')}`);
            }
        }
        // Pattern 2: Analyze critique patterns for successful strategies
        const critiques = episodes
            .map(ep => ep.critique)
            .filter(Boolean);
        if (critiques.length > 0) {
            const critiqueKeywords = this.extractKeywordFrequency(critiques);
            const topCritiquePatterns = this.getTopKeywords(critiqueKeywords, 3);
            if (topCritiquePatterns.length > 0) {
                successIndicators.push(...topCritiquePatterns);
            }
        }
        // Pattern 3: Analyze reward distribution
        const avgReward = episodes.reduce((sum, ep) => sum + ep.reward, 0) / episodes.length;
        const highRewardCount = episodes.filter(ep => ep.reward > avgReward).length;
        const highRewardRatio = highRewardCount / episodes.length;
        if (highRewardRatio > 0.6) {
            successIndicators.push(`High consistency (${(highRewardRatio * 100).toFixed(0)}% above average)`);
        }
        // Pattern 4: Analyze metadata for common parameters
        const metadataPatterns = this.extractMetadataPatterns(episodes);
        if (metadataPatterns.length > 0) {
            commonPatterns.push(...metadataPatterns);
        }
        // Pattern 5: Temporal analysis - learning curve
        const learningTrend = this.analyzeLearningTrend(episodes);
        if (learningTrend) {
            successIndicators.push(learningTrend);
        }
        return { commonPatterns, successIndicators };
    }
    /**
     * Extract keyword frequency from text array using NLP-inspired techniques
     */
    extractKeywordFrequency(texts) {
        const frequency = new Map();
        // Common stop words to filter out
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
            'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
        ]);
        for (const text of texts) {
            // Extract words (alphanumeric sequences)
            const words = text.toLowerCase().match(/\b[a-z0-9_-]+\b/g) || [];
            for (const word of words) {
                if (word.length > 3 && !stopWords.has(word)) {
                    frequency.set(word, (frequency.get(word) || 0) + 1);
                }
            }
        }
        return frequency;
    }
    /**
     * Get top N keywords by frequency
     */
    getTopKeywords(frequency, n) {
        return Array.from(frequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .filter(([_, count]) => count >= 2) // Only keywords appearing at least twice
            .map(([word, _]) => word);
    }
    /**
     * Extract common patterns from episode metadata
     */
    extractMetadataPatterns(episodes) {
        const patterns = [];
        const metadataFields = new Map();
        for (const episode of episodes) {
            if (episode.metadata) {
                try {
                    const metadata = typeof episode.metadata === 'string'
                        ? JSON.parse(episode.metadata)
                        : episode.metadata;
                    for (const [key, value] of Object.entries(metadata)) {
                        if (!metadataFields.has(key)) {
                            metadataFields.set(key, new Set());
                        }
                        metadataFields.get(key).add(value);
                    }
                }
                catch (e) {
                    // Skip invalid metadata
                }
            }
        }
        // Find fields with consistent values
        metadataFields.forEach((values, field) => {
            if (values.size === 1) {
                // All episodes have the same value for this field
                const value = Array.from(values)[0];
                patterns.push(`Consistent ${field}: ${value}`);
            }
        });
        return patterns;
    }
    /**
     * Analyze learning trend across episodes
     */
    analyzeLearningTrend(episodes) {
        if (episodes.length < 3)
            return null;
        // Sort by episode ID (temporal order)
        const sorted = [...episodes].sort((a, b) => a.id - b.id);
        const firstHalfReward = sorted.slice(0, Math.floor(sorted.length / 2))
            .reduce((sum, ep) => sum + ep.reward, 0) / Math.floor(sorted.length / 2);
        const secondHalfReward = sorted.slice(Math.floor(sorted.length / 2))
            .reduce((sum, ep) => sum + ep.reward, 0) / (sorted.length - Math.floor(sorted.length / 2));
        const improvement = ((secondHalfReward - firstHalfReward) / firstHalfReward) * 100;
        if (improvement > 10) {
            return `Strong learning curve (+${improvement.toFixed(0)}% improvement)`;
        }
        else if (improvement > 5) {
            return `Moderate learning curve (+${improvement.toFixed(0)}% improvement)`;
        }
        else if (Math.abs(improvement) < 5) {
            return `Stable performance (±${Math.abs(improvement).toFixed(0)}%)`;
        }
        return null;
    }
    /**
     * Calculate pattern confidence score based on sample size and success rate
     */
    calculatePatternConfidence(sampleSize, successRate) {
        // Confidence increases with sample size and success rate
        // Using a sigmoid-like function for smooth scaling
        const sampleFactor = Math.min(sampleSize / 10, 1.0); // Saturates at 10 samples
        const successFactor = successRate;
        return Math.min(sampleFactor * successFactor, 0.99);
    }
    /**
     * Prune underperforming skills
     */
    pruneSkills(config) {
        const { minUses = 3, minSuccessRate = 0.4, maxAgeDays = 60 } = config;
        const stmt = this.db.prepare(`
      DELETE FROM skills
      WHERE uses < ?
        AND success_rate < ?
        AND created_at < strftime('%s', 'now') - ?
    `);
        const result = stmt.run(minUses, minSuccessRate, maxAgeDays * 86400);
        return result.changes;
    }
    // ========================================================================
    // Private Helper Methods
    // ========================================================================
    getSkillById(id) {
        const stmt = this.db.prepare('SELECT * FROM skills WHERE id = ?');
        const row = stmt.get(id);
        if (!row)
            throw new Error(`Skill ${id} not found`);
        return this.rowToSkill(row);
    }
    rowToSkill(row) {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            signature: JSON.parse(row.signature),
            code: row.code,
            successRate: row.success_rate,
            uses: row.uses,
            avgReward: row.avg_reward,
            avgLatencyMs: row.avg_latency_ms,
            createdFromEpisode: row.created_from_episode,
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined
        };
    }
    buildSkillText(skill) {
        const parts = [skill.name];
        if (skill.description)
            parts.push(skill.description);
        parts.push(JSON.stringify(skill.signature));
        return parts.join('\n');
    }
    storeSkillEmbedding(skillId, embedding) {
        const stmt = this.db.prepare(`
      INSERT INTO skill_embeddings (skill_id, embedding)
      VALUES (?, ?)
    `);
        stmt.run(skillId, Buffer.from(embedding.buffer));
    }
    deserializeEmbedding(buffer) {
        return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
    }
    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    computeSkillScore(skill) {
        // Composite score: similarity * 0.4 + success_rate * 0.3 + (uses/1000) * 0.1 + avg_reward * 0.2
        return (skill.similarity * 0.4 +
            skill.successRate * 0.3 +
            Math.min(skill.uses / 1000, 1.0) * 0.1 +
            skill.avgReward * 0.2);
    }
}
//# sourceMappingURL=SkillLibrary.js.map