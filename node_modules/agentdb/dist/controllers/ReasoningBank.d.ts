/**
 * ReasoningBank Controller - Pattern Storage and Retrieval
 *
 * Manages reasoning patterns with embeddings for semantic similarity search.
 * Integrates with ReasoningBank WASM for high-performance pattern matching.
 *
 * Pattern Structure:
 * - taskType: Type of task (e.g., "code_review", "data_analysis")
 * - approach: Description of the reasoning approach used
 * - successRate: Success rate of this pattern (0-1)
 * - embedding: Vector embedding of the pattern for similarity search
 * - metadata: Additional contextual information
 */
type Database = any;
import { EmbeddingService } from './EmbeddingService.js';
export interface ReasoningPattern {
    id?: number;
    taskType: string;
    approach: string;
    successRate: number;
    embedding?: Float32Array;
    uses?: number;
    avgReward?: number;
    tags?: string[];
    metadata?: Record<string, any>;
    createdAt?: number;
    similarity?: number;
}
export interface PatternSearchQuery {
    taskEmbedding: Float32Array;
    k?: number;
    threshold?: number;
    filters?: {
        taskType?: string;
        minSuccessRate?: number;
        tags?: string[];
    };
}
export interface PatternStats {
    totalPatterns: number;
    avgSuccessRate: number;
    avgUses: number;
    topTaskTypes: Array<{
        taskType: string;
        count: number;
    }>;
    recentPatterns: number;
    highPerformingPatterns: number;
}
export declare class ReasoningBank {
    private db;
    private embedder;
    private cache;
    constructor(db: Database, embedder: EmbeddingService);
    /**
     * Initialize reasoning patterns schema
     */
    private initializeSchema;
    /**
     * Store a reasoning pattern with embedding
     */
    storePattern(pattern: ReasoningPattern): Promise<number>;
    /**
     * Store pattern embedding
     */
    private storePatternEmbedding;
    /**
     * Search patterns by semantic similarity
     */
    searchPatterns(query: PatternSearchQuery): Promise<ReasoningPattern[]>;
    /**
     * Get pattern statistics
     */
    getPatternStats(): PatternStats;
    /**
     * Update pattern statistics after use
     */
    updatePatternStats(patternId: number, success: boolean, reward: number): void;
    /**
     * Get pattern by ID
     */
    getPattern(patternId: number): ReasoningPattern | null;
    /**
     * Delete pattern by ID
     */
    deletePattern(patternId: number): boolean;
    /**
     * Clear query cache
     */
    clearCache(): void;
    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity;
}
export {};
//# sourceMappingURL=ReasoningBank.d.ts.map