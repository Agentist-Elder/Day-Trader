/**
 * CausalMemoryGraph - Causal Reasoning over Agent Memories
 *
 * Implements intervention-based reasoning rather than correlation.
 * Stores p(y|do(x)) estimates and tracks causal uplift across episodes.
 *
 * Based on:
 * - Pearl's do-calculus and causal inference
 * - Uplift modeling from A/B testing
 * - Instrumental variable methods
 */
type Database = any;
export interface CausalEdge {
    id?: number;
    fromMemoryId: number;
    fromMemoryType: 'episode' | 'skill' | 'note' | 'fact';
    toMemoryId: number;
    toMemoryType: 'episode' | 'skill' | 'note' | 'fact';
    similarity: number;
    uplift?: number;
    confidence: number;
    sampleSize?: number;
    evidenceIds?: string[];
    experimentIds?: string[];
    confounderScore?: number;
    mechanism?: string;
    metadata?: Record<string, any>;
}
export interface CausalExperiment {
    id?: number;
    name: string;
    hypothesis: string;
    treatmentId: number;
    treatmentType: string;
    controlId?: number;
    startTime: number;
    endTime?: number;
    sampleSize: number;
    treatmentMean?: number;
    controlMean?: number;
    uplift?: number;
    pValue?: number;
    confidenceIntervalLow?: number;
    confidenceIntervalHigh?: number;
    status: 'running' | 'completed' | 'failed';
    metadata?: Record<string, any>;
}
export interface CausalObservation {
    experimentId: number;
    episodeId: number;
    isTreatment: boolean;
    outcomeValue: number;
    outcomeType: 'reward' | 'success' | 'latency';
    context?: Record<string, any>;
}
export interface CausalQuery {
    interventionMemoryId: number;
    interventionMemoryType: string;
    outcomeMemoryId?: number;
    minConfidence?: number;
    minUplift?: number;
}
export declare class CausalMemoryGraph {
    private db;
    constructor(db: Database);
    /**
     * Add a causal edge between memories
     */
    addCausalEdge(edge: CausalEdge): number;
    /**
     * Create a causal experiment (A/B test)
     */
    createExperiment(experiment: CausalExperiment): number;
    /**
     * Record an observation in an experiment
     */
    recordObservation(observation: CausalObservation): void;
    /**
     * Calculate uplift for an experiment
     */
    calculateUplift(experimentId: number): {
        uplift: number;
        pValue: number;
        confidenceInterval: [number, number];
    };
    /**
     * Query causal effects
     */
    queryCausalEffects(query: CausalQuery): CausalEdge[];
    /**
     * Get causal chain (multi-hop reasoning)
     */
    getCausalChain(fromMemoryId: number, toMemoryId: number, maxDepth?: number): {
        path: number[];
        totalUplift: number;
        confidence: number;
    }[];
    /**
     * Calculate causal gain: E[outcome|do(treatment)] - E[outcome]
     */
    calculateCausalGain(treatmentId: number, outcomeType: 'reward' | 'success' | 'latency'): {
        causalGain: number;
        confidence: number;
        mechanism: string;
    };
    /**
     * Detect confounders using correlation analysis
     */
    detectConfounders(edgeId: number): {
        confounders: Array<{
            memoryId: number;
            correlationWithTreatment: number;
            correlationWithOutcome: number;
            confounderScore: number;
        }>;
    };
    private rowToCausalEdge;
    private mean;
    private variance;
    private standardError;
    private tCDF;
    private tInverse;
    private calculateCorrelation;
}
export {};
//# sourceMappingURL=CausalMemoryGraph.d.ts.map