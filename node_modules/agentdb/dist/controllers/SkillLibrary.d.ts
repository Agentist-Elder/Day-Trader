/**
 * SkillLibrary - Lifelong Learning Skill Management
 *
 * Promotes high-reward trajectories into reusable skills.
 * Manages skill composition, relationships, and adaptive selection.
 *
 * Based on: "Voyager: An Open-Ended Embodied Agent with Large Language Models"
 * https://arxiv.org/abs/2305.16291
 */
type Database = any;
import { EmbeddingService } from './EmbeddingService.js';
export interface Skill {
    id?: number;
    name: string;
    description?: string;
    signature: {
        inputs: Record<string, any>;
        outputs: Record<string, any>;
    };
    code?: string;
    successRate: number;
    uses: number;
    avgReward: number;
    avgLatencyMs: number;
    createdFromEpisode?: number;
    metadata?: Record<string, any>;
}
export interface SkillLink {
    parentSkillId: number;
    childSkillId: number;
    relationship: 'prerequisite' | 'alternative' | 'refinement' | 'composition';
    weight: number;
    metadata?: Record<string, any>;
}
export interface SkillQuery {
    task: string;
    k?: number;
    minSuccessRate?: number;
    preferRecent?: boolean;
}
export declare class SkillLibrary {
    private db;
    private embedder;
    constructor(db: Database, embedder: EmbeddingService);
    /**
     * Create a new skill manually or from an episode
     */
    createSkill(skill: Skill): Promise<number>;
    /**
     * Update skill statistics after use
     */
    updateSkillStats(skillId: number, success: boolean, reward: number, latencyMs: number): void;
    /**
     * Retrieve skills relevant to a task
     */
    searchSkills(query: SkillQuery): Promise<Skill[]>;
    retrieveSkills(query: SkillQuery): Promise<Skill[]>;
    /**
     * Link two skills with a relationship
     */
    linkSkills(link: SkillLink): void;
    /**
     * Get skill composition plan (prerequisites and alternatives)
     */
    getSkillPlan(skillId: number): {
        skill: Skill;
        prerequisites: Skill[];
        alternatives: Skill[];
        refinements: Skill[];
    };
    /**
     * Consolidate high-reward episodes into skills with ML pattern extraction
     * This is the core learning mechanism enhanced with pattern analysis
     */
    consolidateEpisodesIntoSkills(config: {
        minAttempts?: number;
        minReward?: number;
        timeWindowDays?: number;
        extractPatterns?: boolean;
    }): Promise<{
        created: number;
        updated: number;
        patterns: Array<{
            task: string;
            commonPatterns: string[];
            successIndicators: string[];
            avgReward: number;
        }>;
    }>;
    /**
     * Extract common patterns from successful episodes using ML-inspired analysis
     */
    private extractPatternsFromEpisodes;
    /**
     * Extract keyword frequency from text array using NLP-inspired techniques
     */
    private extractKeywordFrequency;
    /**
     * Get top N keywords by frequency
     */
    private getTopKeywords;
    /**
     * Extract common patterns from episode metadata
     */
    private extractMetadataPatterns;
    /**
     * Analyze learning trend across episodes
     */
    private analyzeLearningTrend;
    /**
     * Calculate pattern confidence score based on sample size and success rate
     */
    private calculatePatternConfidence;
    /**
     * Prune underperforming skills
     */
    pruneSkills(config: {
        minUses?: number;
        minSuccessRate?: number;
        maxAgeDays?: number;
    }): number;
    private getSkillById;
    private rowToSkill;
    private buildSkillText;
    private storeSkillEmbedding;
    private deserializeEmbedding;
    private cosineSimilarity;
    private computeSkillScore;
}
export {};
//# sourceMappingURL=SkillLibrary.d.ts.map