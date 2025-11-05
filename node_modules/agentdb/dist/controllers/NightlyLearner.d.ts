/**
 * Nightly Learner - Automated Causal Discovery and Consolidation
 *
 * Runs as a background job to:
 * 1. Discover new causal edges from episode patterns
 * 2. Run A/B experiments on promising hypotheses
 * 3. Calculate uplift for completed experiments
 * 4. Prune low-confidence edges
 * 5. Update rerank weights based on performance
 *
 * Based on doubly robust learner:
 * τ̂(x) = μ1(x) − μ0(x) + [a*(y−μ1(x)) / e(x)] − [(1−a)*(y−μ0(x)) / (1−e(x))]
 */
type Database = any;
import { CausalEdge } from './CausalMemoryGraph.js';
import { EmbeddingService } from './EmbeddingService.js';
export interface LearnerConfig {
    minSimilarity: number;
    minSampleSize: number;
    confidenceThreshold: number;
    upliftThreshold: number;
    pruneOldEdges: boolean;
    edgeMaxAgeDays: number;
    autoExperiments: boolean;
    experimentBudget: number;
}
export interface LearnerReport {
    timestamp: number;
    executionTimeMs: number;
    edgesDiscovered: number;
    edgesPruned: number;
    experimentsCompleted: number;
    experimentsCreated: number;
    avgUplift: number;
    avgConfidence: number;
    recommendations: string[];
}
export declare class NightlyLearner {
    private config;
    private db;
    private causalGraph;
    private reflexion;
    private skillLibrary;
    constructor(db: Database, embedder: EmbeddingService, config?: LearnerConfig);
    /**
     * Main learning job - runs all discovery and consolidation tasks
     */
    run(): Promise<LearnerReport>;
    /**
     * Discover causal edges using doubly robust learner
     *
     * τ̂(x) = μ1(x) − μ0(x) + [a*(y−μ1(x)) / e(x)] − [(1−a)*(y−μ0(x)) / (1−e(x))]
     *
     * Where:
     * - μ1(x) = outcome model for treatment
     * - μ0(x) = outcome model for control
     * - e(x) = propensity score (probability of treatment)
     * - a = treatment indicator
     * - y = observed outcome
     */
    discover(config: {
        minAttempts?: number;
        minSuccessRate?: number;
        minConfidence?: number;
        dryRun?: boolean;
    }): Promise<CausalEdge[]>;
    private discoverCausalEdges;
    /**
     * Calculate propensity score e(x) - probability of treatment given context
     */
    private calculatePropensity;
    /**
     * Calculate outcome model μ(x) - expected outcome given treatment status
     */
    private calculateOutcomeModel;
    /**
     * Get sample size for a task type
     */
    private getSampleSize;
    /**
     * Calculate confidence based on sample size and effect size
     */
    private calculateConfidence;
    /**
     * Complete running A/B experiments and calculate uplift
     */
    private completeExperiments;
    /**
     * Create new A/B experiments for promising hypotheses
     */
    private createExperiments;
    /**
     * Prune old or low-confidence edges
     */
    private pruneEdges;
    /**
     * Calculate overall statistics
     */
    private calculateStats;
    /**
     * Generate recommendations based on learning results
     */
    private generateRecommendations;
    /**
     * Print report to console
     */
    private printReport;
    /**
     * Update learner configuration
     */
    updateConfig(config: Partial<LearnerConfig>): void;
}
export {};
//# sourceMappingURL=NightlyLearner.d.ts.map