/**
 * BatchOperations - Optimized Batch Processing for AgentDB
 *
 * Implements efficient batch operations:
 * - Bulk inserts with transactions
 * - Batch embedding generation
 * - Parallel processing
 * - Progress tracking
 *
 * SECURITY: Fixed SQL injection vulnerabilities:
 * - Table names validated against whitelist
 * - Column names validated against whitelist
 * - All queries use parameterized values
 */
import { validateTableName, buildSafeWhereClause, buildSafeSetClause, ValidationError, } from '../security/input-validation.js';
export class BatchOperations {
    db;
    embedder;
    config;
    constructor(db, embedder, config) {
        this.db = db;
        this.embedder = embedder;
        this.config = {
            batchSize: 100,
            parallelism: 4,
            ...config
        };
    }
    /**
     * Bulk insert episodes with embeddings
     */
    async insertEpisodes(episodes) {
        const totalBatches = Math.ceil(episodes.length / this.config.batchSize);
        let completed = 0;
        for (let i = 0; i < episodes.length; i += this.config.batchSize) {
            const batch = episodes.slice(i, i + this.config.batchSize);
            // Generate embeddings in parallel
            const texts = batch.map(ep => this.buildEpisodeText(ep));
            const embeddings = await this.embedder.embedBatch(texts);
            // Insert with transaction
            const transaction = this.db.transaction(() => {
                const episodeStmt = this.db.prepare(`
          INSERT INTO episodes (
            session_id, task, input, output, critique, reward, success,
            latency_ms, tokens_used, tags, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
                const embeddingStmt = this.db.prepare(`
          INSERT INTO episode_embeddings (episode_id, embedding)
          VALUES (?, ?)
        `);
                batch.forEach((episode, idx) => {
                    const result = episodeStmt.run(episode.sessionId, episode.task, episode.input || null, episode.output || null, episode.critique || null, episode.reward, episode.success ? 1 : 0, episode.latencyMs || null, episode.tokensUsed || null, episode.tags ? JSON.stringify(episode.tags) : null, episode.metadata ? JSON.stringify(episode.metadata) : null);
                    const episodeId = result.lastInsertRowid;
                    embeddingStmt.run(episodeId, Buffer.from(embeddings[idx].buffer));
                });
            });
            transaction();
            completed += batch.length;
            if (this.config.progressCallback) {
                this.config.progressCallback(completed, episodes.length);
            }
        }
        return completed;
    }
    /**
     * Bulk update embeddings for existing episodes
     */
    async regenerateEmbeddings(episodeIds) {
        let episodes;
        if (episodeIds) {
            const placeholders = episodeIds.map(() => '?').join(',');
            episodes = this.db.prepare(`SELECT id, task, critique, output FROM episodes WHERE id IN (${placeholders})`).all(...episodeIds);
        }
        else {
            episodes = this.db.prepare('SELECT id, task, critique, output FROM episodes').all();
        }
        let completed = 0;
        const totalBatches = Math.ceil(episodes.length / this.config.batchSize);
        for (let i = 0; i < episodes.length; i += this.config.batchSize) {
            const batch = episodes.slice(i, i + this.config.batchSize);
            // Generate embeddings
            const texts = batch.map((ep) => [ep.task, ep.critique, ep.output].filter(Boolean).join('\n'));
            const embeddings = await this.embedder.embedBatch(texts);
            // Update with transaction
            const transaction = this.db.transaction(() => {
                const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO episode_embeddings (episode_id, embedding)
          VALUES (?, ?)
        `);
                batch.forEach((episode, idx) => {
                    stmt.run(episode.id, Buffer.from(embeddings[idx].buffer));
                });
            });
            transaction();
            completed += batch.length;
            if (this.config.progressCallback) {
                this.config.progressCallback(completed, episodes.length);
            }
        }
        return completed;
    }
    /**
     * Parallel batch processing with worker pool
     */
    async processInParallel(items, processor) {
        const results = [];
        const chunks = this.chunkArray(items, this.config.parallelism);
        for (const chunk of chunks) {
            const chunkResults = await Promise.all(chunk.map(item => processor(item)));
            results.push(...chunkResults);
            if (this.config.progressCallback) {
                this.config.progressCallback(results.length, items.length);
            }
        }
        return results;
    }
    /**
     * Bulk delete with conditions (SQL injection safe)
     */
    bulkDelete(table, conditions) {
        try {
            // SECURITY: Validate table name against whitelist
            const validatedTable = validateTableName(table);
            // SECURITY: Build safe WHERE clause with validated column names
            const { clause, values } = buildSafeWhereClause(validatedTable, conditions);
            // Execute with parameterized query
            const stmt = this.db.prepare(`DELETE FROM ${validatedTable} WHERE ${clause}`);
            const result = stmt.run(...values);
            return result.changes;
        }
        catch (error) {
            if (error instanceof ValidationError) {
                console.error(`❌ Bulk delete validation error: ${error.message}`);
                throw error;
            }
            throw error;
        }
    }
    /**
     * Bulk update with conditions (SQL injection safe)
     */
    bulkUpdate(table, updates, conditions) {
        try {
            // SECURITY: Validate table name against whitelist
            const validatedTable = validateTableName(table);
            // SECURITY: Build safe SET clause with validated column names
            const setResult = buildSafeSetClause(validatedTable, updates);
            // SECURITY: Build safe WHERE clause with validated column names
            const whereResult = buildSafeWhereClause(validatedTable, conditions);
            // Combine values from SET and WHERE clauses
            const values = [...setResult.values, ...whereResult.values];
            // Execute with parameterized query
            const stmt = this.db.prepare(`UPDATE ${validatedTable} SET ${setResult.clause} WHERE ${whereResult.clause}`);
            const result = stmt.run(...values);
            return result.changes;
        }
        catch (error) {
            if (error instanceof ValidationError) {
                console.error(`❌ Bulk update validation error: ${error.message}`);
                throw error;
            }
            throw error;
        }
    }
    /**
     * Vacuum and optimize database
     */
    optimize() {
        console.log('🔧 Optimizing database...');
        // Analyze tables for query planner
        this.db.exec('ANALYZE');
        // Rebuild indexes
        const tables = this.db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
        for (const { name } of tables) {
            this.db.exec(`REINDEX ${name}`);
        }
        // Vacuum to reclaim space
        this.db.exec('VACUUM');
        console.log('✅ Database optimized');
    }
    /**
     * Get database statistics
     */
    getStats() {
        const pageSize = this.db.pragma('page_size', { simple: true });
        const pageCount = this.db.pragma('page_count', { simple: true });
        const totalSize = pageSize * pageCount;
        const tables = this.db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
        const tableStats = tables.map(({ name }) => {
            const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get();
            const pages = this.db.prepare(`SELECT COUNT(*) as count FROM dbstat WHERE name = ?`).get(name);
            return {
                name,
                rows: count.count,
                size: (pages?.count || 0) * pageSize
            };
        });
        return { totalSize, tableStats };
    }
    // ========================================================================
    // Private Methods
    // ========================================================================
    buildEpisodeText(episode) {
        const parts = [episode.task];
        if (episode.critique)
            parts.push(episode.critique);
        if (episode.output)
            parts.push(episode.output);
        return parts.join('\n');
    }
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}
//# sourceMappingURL=BatchOperations.js.map