/**
 * ExplainableRecall - Provenance and Justification for Memory Retrieval
 *
 * Every retrieval returns:
 * - Minimal hitting set of facts that justify the answer
 * - Merkle proof chain for provenance
 * - Policy compliance certificates
 *
 * Based on:
 * - Minimal hitting set algorithms
 * - Merkle tree provenance
 * - Explainable AI techniques
 */
type Database = any;
export interface RecallCertificate {
    id: string;
    queryId: string;
    queryText: string;
    chunkIds: string[];
    chunkTypes: string[];
    minimalWhy: string[];
    redundancyRatio: number;
    completenessScore: number;
    merkleRoot: string;
    sourceHashes: string[];
    proofChain: MerkleProof[];
    policyProof?: string;
    policyVersion?: string;
    accessLevel: 'public' | 'internal' | 'confidential' | 'restricted';
    latencyMs?: number;
    metadata?: Record<string, any>;
}
export interface MerkleProof {
    hash: string;
    position: 'left' | 'right';
}
export interface JustificationPath {
    chunkId: string;
    chunkType: string;
    reason: 'semantic_match' | 'causal_link' | 'prerequisite' | 'constraint';
    necessityScore: number;
    pathElements: string[];
}
export interface ProvenanceSource {
    id?: number;
    sourceType: 'episode' | 'skill' | 'note' | 'fact' | 'external';
    sourceId: number;
    contentHash: string;
    parentHash?: string;
    derivedFrom?: string[];
    creator?: string;
    metadata?: Record<string, any>;
}
export declare class ExplainableRecall {
    private db;
    constructor(db: Database);
    /**
     * Create a recall certificate for a retrieval operation
     */
    createCertificate(params: {
        queryId: string;
        queryText: string;
        chunks: Array<{
            id: string;
            type: string;
            content: string;
            relevance: number;
        }>;
        requirements: string[];
        accessLevel?: string;
    }): RecallCertificate;
    /**
     * Verify a recall certificate
     */
    verifyCertificate(certificateId: string): {
        valid: boolean;
        issues: string[];
    };
    /**
     * Get justification for why a chunk was included
     */
    getJustification(certificateId: string, chunkId: string): JustificationPath | null;
    /**
     * Get provenance lineage for a source
     */
    getProvenanceLineage(contentHash: string): ProvenanceSource[];
    /**
     * Audit certificate access
     */
    auditCertificate(certificateId: string): {
        certificate: RecallCertificate;
        justifications: JustificationPath[];
        provenance: Map<string, ProvenanceSource[]>;
        quality: {
            completeness: number;
            redundancy: number;
            avgNecessity: number;
        };
    };
    /**
     * Compute minimal hitting set using greedy algorithm
     * A hitting set contains at least one element from each requirement
     */
    private computeMinimalHittingSet;
    /**
     * Calculate completeness score
     */
    private calculateCompleteness;
    /**
     * Get or create provenance record
     */
    private getOrCreateProvenance;
    /**
     * Get content hash for a memory
     */
    private getContentHash;
    /**
     * Build Merkle tree from hashes
     */
    private buildMerkleTree;
    /**
     * Get Merkle proof for a leaf
     */
    private getMerkleProof;
    /**
     * Generate certificate ID
     */
    private generateCertificateId;
    /**
     * Store justification paths
     */
    private storeJustificationPaths;
    /**
     * Determine reason for inclusion
     */
    private determineReason;
}
export {};
//# sourceMappingURL=ExplainableRecall.d.ts.map