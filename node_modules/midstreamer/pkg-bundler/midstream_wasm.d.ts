/* tslint:disable */
/* eslint-disable */
export function init_panic_hook(): void;
export function version(): string;
export function benchmark_dtw(size: number, iterations: number): number;
export class MetaPattern {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  readonly pattern_id: string;
  readonly confidence: number;
  readonly iteration: number;
  readonly improvement: number;
}
export class NanoScheduler {
  free(): void;
  [Symbol.dispose](): void;
  constructor();
  /**
   * Schedule a task with nanosecond precision
   */
  schedule(callback: Function, delay_ns: number): number;
  /**
   * Schedule a repeating task
   */
  schedule_repeating(callback: Function, interval_ns: number): number;
  /**
   * Cancel a scheduled task
   */
  cancel(task_id: number): boolean;
  /**
   * Get current time in nanoseconds (using performance.now())
   */
  now_ns(): number;
  /**
   * Process pending tasks (call from requestAnimationFrame)
   */
  tick(): number;
  readonly pending_count: number;
}
export class QuicMultistream {
  free(): void;
  [Symbol.dispose](): void;
  constructor();
  /**
   * Open a new stream with priority
   */
  open_stream(priority: number): number;
  /**
   * Close a stream
   */
  close_stream(stream_id: number): boolean;
  /**
   * Send data on a stream (simulated)
   */
  send(stream_id: number, data: Uint8Array): number;
  /**
   * Receive data on a stream (simulated)
   */
  receive(stream_id: number, size: number): Uint8Array;
  /**
   * Get stream statistics
   */
  get_stats(stream_id: number): any;
  readonly stream_count: number;
}
export class StrangeLoop {
  free(): void;
  [Symbol.dispose](): void;
  constructor(learning_rate?: number | null);
  /**
   * Learn from a pattern observation
   */
  observe(pattern_id: string, performance: number): void;
  /**
   * Get pattern confidence
   */
  get_confidence(pattern_id: string): number | undefined;
  /**
   * Get best pattern
   */
  best_pattern(): MetaPattern | undefined;
  /**
   * Reflect on learning progress (meta-cognition)
   */
  reflect(): any;
  readonly iteration_count: number;
  readonly pattern_count: number;
}
export class TemporalCompare {
  free(): void;
  [Symbol.dispose](): void;
  constructor(window_size?: number | null);
  /**
   * Dynamic Time Warping distance between two sequences
   */
  dtw(seq1: Float64Array, seq2: Float64Array): number;
  /**
   * Longest Common Subsequence length
   */
  lcs(seq1: Int32Array, seq2: Int32Array): number;
  /**
   * Levenshtein edit distance
   */
  edit_distance(s1: string, s2: string): number;
  /**
   * Comprehensive temporal analysis
   */
  analyze(seq1: Float64Array, seq2: Float64Array): TemporalMetrics;
}
export class TemporalMetrics {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  readonly dtw_distance: number;
  readonly lcs_length: number;
  readonly edit_distance: number;
  readonly similarity_score: number;
}
