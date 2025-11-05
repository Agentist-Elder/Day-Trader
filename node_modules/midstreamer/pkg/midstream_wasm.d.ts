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

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly init_panic_hook: () => void;
  readonly __wbg_temporalmetrics_free: (a: number, b: number) => void;
  readonly temporalmetrics_dtw_distance: (a: number) => number;
  readonly temporalmetrics_lcs_length: (a: number) => number;
  readonly temporalmetrics_edit_distance: (a: number) => number;
  readonly temporalmetrics_similarity_score: (a: number) => number;
  readonly __wbg_temporalcompare_free: (a: number, b: number) => void;
  readonly temporalcompare_new: (a: number) => number;
  readonly temporalcompare_dtw: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly temporalcompare_lcs: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly temporalcompare_edit_distance: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly temporalcompare_analyze: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly __wbg_nanoscheduler_free: (a: number, b: number) => void;
  readonly nanoscheduler_new: () => number;
  readonly nanoscheduler_schedule: (a: number, b: number, c: number) => number;
  readonly nanoscheduler_schedule_repeating: (a: number, b: number, c: number) => number;
  readonly nanoscheduler_cancel: (a: number, b: number) => number;
  readonly nanoscheduler_now_ns: (a: number) => number;
  readonly nanoscheduler_tick: (a: number) => number;
  readonly nanoscheduler_pending_count: (a: number) => number;
  readonly __wbg_metapattern_free: (a: number, b: number) => void;
  readonly metapattern_pattern_id: (a: number, b: number) => void;
  readonly metapattern_confidence: (a: number) => number;
  readonly metapattern_iteration: (a: number) => number;
  readonly metapattern_improvement: (a: number) => number;
  readonly __wbg_strangeloop_free: (a: number, b: number) => void;
  readonly strangeloop_new: (a: number, b: number) => number;
  readonly strangeloop_observe: (a: number, b: number, c: number, d: number) => void;
  readonly strangeloop_get_confidence: (a: number, b: number, c: number, d: number) => void;
  readonly strangeloop_best_pattern: (a: number) => number;
  readonly strangeloop_reflect: (a: number) => number;
  readonly strangeloop_iteration_count: (a: number) => number;
  readonly strangeloop_pattern_count: (a: number) => number;
  readonly __wbg_quicmultistream_free: (a: number, b: number) => void;
  readonly quicmultistream_new: () => number;
  readonly quicmultistream_open_stream: (a: number, b: number) => number;
  readonly quicmultistream_close_stream: (a: number, b: number) => number;
  readonly quicmultistream_send: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly quicmultistream_receive: (a: number, b: number, c: number, d: number) => void;
  readonly quicmultistream_get_stats: (a: number, b: number) => number;
  readonly quicmultistream_stream_count: (a: number) => number;
  readonly version: (a: number) => void;
  readonly benchmark_dtw: (a: number, b: number) => number;
  readonly __wbindgen_export_0: (a: number) => void;
  readonly __wbindgen_export_1: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_2: (a: number, b: number) => number;
  readonly __wbindgen_export_3: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
