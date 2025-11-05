/**
 * ReflexionMemory - Episodic Replay Memory System
 *
 * Implements reflexion-style episodic replay for agent self-improvement.
 * Stores self-critiques and outcomes, retrieves relevant past experiences.
 *
 * Based on: "Reflexion: Language Agents with Verbal Reinforcement Learning"
 * https://arxiv.org/abs/2303.11366
 */
type Database = any;
import { EmbeddingService } from './EmbeddingService.js';
export interface Episode {
    id?: number;
    ts?: number;
    sessionId: string;
    task: string;
    input?: string;
    output?: string;
    critique?: string;
    reward: number;
    success: boolean;
    latencyMs?: number;
    tokensUsed?: number;
    tags?: string[];
    metadata?: Record<string, any>;
}
export interface EpisodeWithEmbedding extends Episode {
    embedding?: Float32Array;
    similarity?: number;
}
export interface ReflexionQuery {
    task: string;
    currentState?: string;
    k?: number;
    minReward?: number;
    onlyFailures?: boolean;
    onlySuccesses?: boolean;
    timeWindowDays?: number;
}
export declare class ReflexionMemory {
    private db;
    private embedder;
    constructor(db: Database, embedder: EmbeddingService);
    /**
     * Store a new episode with its critique and outcome
     */
    storeEpisode(episode: Episode): Promise<number>;
    /**
     * Retrieve relevant past episodes for a new task attempt
     */
    retrieveRelevant(query: ReflexionQuery): Promise<EpisodeWithEmbedding[]>;
    /**
     * Get statistics for a task
     */
    getTaskStats(task: string, timeWindowDays?: number): {
        totalAttempts: number;
        successRate: number;
        avgReward: number;
        avgLatency: number;
        improvementTrend: number;
    };
    /**
     * Build critique summary from similar failed episodes
     */
    getCritiqueSummary(query: ReflexionQuery): Promise<string>;
    /**
     * Get successful strategies for a task
     */
    getSuccessStrategies(query: ReflexionQuery): Promise<string>;
    /**
     * Prune low-quality episodes based on TTL and quality threshold
     */
    pruneEpisodes(config: {
        minReward?: number;
        maxAgeDays?: number;
        keepMinPerTask?: number;
    }): number;
    private buildEpisodeText;
    private storeEmbedding;
    private serializeEmbedding;
    private deserializeEmbedding;
    private cosineSimilarity;
}
export {};
//# sourceMappingURL=ReflexionMemory.d.ts.map