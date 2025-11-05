let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function getObject(idx) { return heap[idx]; }

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_export_0(addHeapObject(e));
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    }
}

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

export function init_panic_hook() {
    wasm.init_panic_hook();
}

let cachedFloat64ArrayMemory0 = null;

function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function passArrayF64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getFloat64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedUint32ArrayMemory0 = null;

function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}
/**
 * @returns {string}
 */
export function version() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.version(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export_1(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {number} size
 * @param {number} iterations
 * @returns {number}
 */
export function benchmark_dtw(size, iterations) {
    const ret = wasm.benchmark_dtw(size, iterations);
    return ret;
}

const MetaPatternFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_metapattern_free(ptr >>> 0, 1));

export class MetaPattern {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(MetaPattern.prototype);
        obj.__wbg_ptr = ptr;
        MetaPatternFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MetaPatternFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_metapattern_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get pattern_id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.metapattern_pattern_id(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_1(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    get confidence() {
        const ret = wasm.metapattern_confidence(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get iteration() {
        const ret = wasm.metapattern_iteration(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get improvement() {
        const ret = wasm.metapattern_improvement(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) MetaPattern.prototype[Symbol.dispose] = MetaPattern.prototype.free;

const NanoSchedulerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_nanoscheduler_free(ptr >>> 0, 1));

export class NanoScheduler {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NanoSchedulerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_nanoscheduler_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.nanoscheduler_new();
        this.__wbg_ptr = ret >>> 0;
        NanoSchedulerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Schedule a task with nanosecond precision
     * @param {Function} callback
     * @param {number} delay_ns
     * @returns {number}
     */
    schedule(callback, delay_ns) {
        const ret = wasm.nanoscheduler_schedule(this.__wbg_ptr, addHeapObject(callback), delay_ns);
        return ret >>> 0;
    }
    /**
     * Schedule a repeating task
     * @param {Function} callback
     * @param {number} interval_ns
     * @returns {number}
     */
    schedule_repeating(callback, interval_ns) {
        const ret = wasm.nanoscheduler_schedule_repeating(this.__wbg_ptr, addHeapObject(callback), interval_ns);
        return ret >>> 0;
    }
    /**
     * Cancel a scheduled task
     * @param {number} task_id
     * @returns {boolean}
     */
    cancel(task_id) {
        const ret = wasm.nanoscheduler_cancel(this.__wbg_ptr, task_id);
        return ret !== 0;
    }
    /**
     * Get current time in nanoseconds (using performance.now())
     * @returns {number}
     */
    now_ns() {
        const ret = wasm.nanoscheduler_now_ns(this.__wbg_ptr);
        return ret;
    }
    /**
     * Process pending tasks (call from requestAnimationFrame)
     * @returns {number}
     */
    tick() {
        const ret = wasm.nanoscheduler_tick(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get pending_count() {
        const ret = wasm.nanoscheduler_pending_count(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) NanoScheduler.prototype[Symbol.dispose] = NanoScheduler.prototype.free;

const QuicMultistreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_quicmultistream_free(ptr >>> 0, 1));

export class QuicMultistream {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        QuicMultistreamFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_quicmultistream_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.quicmultistream_new();
        this.__wbg_ptr = ret >>> 0;
        QuicMultistreamFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Open a new stream with priority
     * @param {number} priority
     * @returns {number}
     */
    open_stream(priority) {
        const ret = wasm.quicmultistream_open_stream(this.__wbg_ptr, priority);
        return ret >>> 0;
    }
    /**
     * Close a stream
     * @param {number} stream_id
     * @returns {boolean}
     */
    close_stream(stream_id) {
        const ret = wasm.quicmultistream_close_stream(this.__wbg_ptr, stream_id);
        return ret !== 0;
    }
    /**
     * Send data on a stream (simulated)
     * @param {number} stream_id
     * @param {Uint8Array} data
     * @returns {number}
     */
    send(stream_id, data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_export_2);
            const len0 = WASM_VECTOR_LEN;
            wasm.quicmultistream_send(retptr, this.__wbg_ptr, stream_id, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return r0 >>> 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Receive data on a stream (simulated)
     * @param {number} stream_id
     * @param {number} size
     * @returns {Uint8Array}
     */
    receive(stream_id, size) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.quicmultistream_receive(retptr, this.__wbg_ptr, stream_id, size);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get stream statistics
     * @param {number} stream_id
     * @returns {any}
     */
    get_stats(stream_id) {
        const ret = wasm.quicmultistream_get_stats(this.__wbg_ptr, stream_id);
        return takeObject(ret);
    }
    /**
     * @returns {number}
     */
    get stream_count() {
        const ret = wasm.quicmultistream_stream_count(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) QuicMultistream.prototype[Symbol.dispose] = QuicMultistream.prototype.free;

const StrangeLoopFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_strangeloop_free(ptr >>> 0, 1));

export class StrangeLoop {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StrangeLoopFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_strangeloop_free(ptr, 0);
    }
    /**
     * @param {number | null} [learning_rate]
     */
    constructor(learning_rate) {
        const ret = wasm.strangeloop_new(!isLikeNone(learning_rate), isLikeNone(learning_rate) ? 0 : learning_rate);
        this.__wbg_ptr = ret >>> 0;
        StrangeLoopFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Learn from a pattern observation
     * @param {string} pattern_id
     * @param {number} performance
     */
    observe(pattern_id, performance) {
        const ptr0 = passStringToWasm0(pattern_id, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
        const len0 = WASM_VECTOR_LEN;
        wasm.strangeloop_observe(this.__wbg_ptr, ptr0, len0, performance);
    }
    /**
     * Get pattern confidence
     * @param {string} pattern_id
     * @returns {number | undefined}
     */
    get_confidence(pattern_id) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(pattern_id, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
            const len0 = WASM_VECTOR_LEN;
            wasm.strangeloop_get_confidence(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get best pattern
     * @returns {MetaPattern | undefined}
     */
    best_pattern() {
        const ret = wasm.strangeloop_best_pattern(this.__wbg_ptr);
        return ret === 0 ? undefined : MetaPattern.__wrap(ret);
    }
    /**
     * Reflect on learning progress (meta-cognition)
     * @returns {any}
     */
    reflect() {
        const ret = wasm.strangeloop_reflect(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @returns {number}
     */
    get iteration_count() {
        const ret = wasm.strangeloop_iteration_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get pattern_count() {
        const ret = wasm.strangeloop_pattern_count(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) StrangeLoop.prototype[Symbol.dispose] = StrangeLoop.prototype.free;

const TemporalCompareFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_temporalcompare_free(ptr >>> 0, 1));

export class TemporalCompare {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TemporalCompareFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_temporalcompare_free(ptr, 0);
    }
    /**
     * @param {number | null} [window_size]
     */
    constructor(window_size) {
        const ret = wasm.temporalcompare_new(isLikeNone(window_size) ? 0x100000001 : (window_size) >>> 0);
        this.__wbg_ptr = ret >>> 0;
        TemporalCompareFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Dynamic Time Warping distance between two sequences
     * @param {Float64Array} seq1
     * @param {Float64Array} seq2
     * @returns {number}
     */
    dtw(seq1, seq2) {
        const ptr0 = passArrayF64ToWasm0(seq1, wasm.__wbindgen_export_2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF64ToWasm0(seq2, wasm.__wbindgen_export_2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.temporalcompare_dtw(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * Longest Common Subsequence length
     * @param {Int32Array} seq1
     * @param {Int32Array} seq2
     * @returns {number}
     */
    lcs(seq1, seq2) {
        const ptr0 = passArray32ToWasm0(seq1, wasm.__wbindgen_export_2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(seq2, wasm.__wbindgen_export_2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.temporalcompare_lcs(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret >>> 0;
    }
    /**
     * Levenshtein edit distance
     * @param {string} s1
     * @param {string} s2
     * @returns {number}
     */
    edit_distance(s1, s2) {
        const ptr0 = passStringToWasm0(s1, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(s2, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.temporalcompare_edit_distance(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret >>> 0;
    }
    /**
     * Comprehensive temporal analysis
     * @param {Float64Array} seq1
     * @param {Float64Array} seq2
     * @returns {TemporalMetrics}
     */
    analyze(seq1, seq2) {
        const ptr0 = passArrayF64ToWasm0(seq1, wasm.__wbindgen_export_2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF64ToWasm0(seq2, wasm.__wbindgen_export_2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.temporalcompare_analyze(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return TemporalMetrics.__wrap(ret);
    }
}
if (Symbol.dispose) TemporalCompare.prototype[Symbol.dispose] = TemporalCompare.prototype.free;

const TemporalMetricsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_temporalmetrics_free(ptr >>> 0, 1));

export class TemporalMetrics {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TemporalMetrics.prototype);
        obj.__wbg_ptr = ptr;
        TemporalMetricsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TemporalMetricsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_temporalmetrics_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get dtw_distance() {
        const ret = wasm.temporalmetrics_dtw_distance(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get lcs_length() {
        const ret = wasm.temporalmetrics_lcs_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get edit_distance() {
        const ret = wasm.temporalmetrics_edit_distance(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get similarity_score() {
        const ret = wasm.temporalmetrics_similarity_score(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) TemporalMetrics.prototype[Symbol.dispose] = TemporalMetrics.prototype.free;

export function __wbg_Error_e17e777aac105295(arg0, arg1) {
    const ret = Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_call_13410aac570ffff7() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_error_7534b8e9a36f1ab4(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_export_1(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_instanceof_Window_12d20d558ef92592(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Window;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_new_19c25a3f2fa63a02() {
    const ret = new Object();
    return addHeapObject(ret);
};

export function __wbg_new_2ff1f68f3676ea53() {
    const ret = new Map();
    return addHeapObject(ret);
};

export function __wbg_new_8a6f238a6ece86ea() {
    const ret = new Error();
    return addHeapObject(ret);
};

export function __wbg_newnoargs_254190557c45b4ec(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_now_1e80617bcee43265() {
    const ret = Date.now();
    return ret;
};

export function __wbg_now_886b39d7ec380719(arg0) {
    const ret = getObject(arg0).now();
    return ret;
};

export function __wbg_performance_a221af8decc752fb(arg0) {
    const ret = getObject(arg0).performance;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_set_3f1d0b984ed272ed(arg0, arg1, arg2) {
    getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
};

export function __wbg_set_453345bcda80b89a() { return handleError(function (arg0, arg1, arg2) {
    const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
    return ret;
}, arguments) };

export function __wbg_set_b7f1cf4fae26fe2a(arg0, arg1, arg2) {
    const ret = getObject(arg0).set(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_stack_0ed75d68575b0f3c(arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_static_accessor_GLOBAL_8921f820c2ce3f12() {
    const ret = typeof global === 'undefined' ? null : global;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_static_accessor_GLOBAL_THIS_f0a4409105898184() {
    const ret = typeof globalThis === 'undefined' ? null : globalThis;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_static_accessor_SELF_995b214ae681ff99() {
    const ret = typeof self === 'undefined' ? null : self;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_static_accessor_WINDOW_cde3890479c675ea() {
    const ret = typeof window === 'undefined' ? null : window;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_wbindgendebugstring_99ef257a3ddda34d(arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_wbindgenisstring_d4fa939789f003b0(arg0) {
    const ret = typeof(getObject(arg0)) === 'string';
    return ret;
};

export function __wbg_wbindgenisundefined_c4b71d073b92f3c5(arg0) {
    const ret = getObject(arg0) === undefined;
    return ret;
};

export function __wbg_wbindgenthrow_451ec1a8469d7eb6(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_cast_2241b6af4c4b2941(arg0, arg1) {
    // Cast intrinsic for `Ref(String) -> Externref`.
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbindgen_cast_d6cd19b81560fd6e(arg0) {
    // Cast intrinsic for `F64 -> Externref`.
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbindgen_object_clone_ref(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

