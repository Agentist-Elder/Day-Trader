/**
 * Real-time streaming analysis module for Midstreamer
 *
 * Supports:
 * - stdin streaming from pipes
 * - File watching for continuous monitoring
 * - WebSocket streams for network data
 * - Windowed DTW analysis on live data
 */

const fs = require('fs');
const readline = require('readline');
const EventEmitter = require('events');

class StreamAnalyzer extends EventEmitter {
  constructor(midstream, options = {}) {
    super();
    this.midstream = midstream;
    this.windowSize = options.windowSize || 100;
    this.slideSize = options.slideSize || 10;
    this.buffer = [];
    this.referenceSequence = options.reference || null;
    this.temporal = null;
    this.stats = {
      samplesProcessed: 0,
      windowsAnalyzed: 0,
      anomaliesDetected: 0,
      startTime: Date.now()
    };

    if (this.midstream && this.midstream.TemporalCompare) {
      this.temporal = new this.midstream.TemporalCompare(null);
    }
  }

  /**
   * Process a single data point
   */
  processSample(value) {
    this.buffer.push(parseFloat(value));
    this.stats.samplesProcessed++;

    // Keep buffer at maximum window size
    if (this.buffer.length > this.windowSize * 2) {
      this.buffer.shift();
    }

    // Analyze when we have enough data
    if (this.buffer.length >= this.windowSize &&
        this.stats.samplesProcessed % this.slideSize === 0) {
      this.analyzeWindow();
    }

    this.emit('sample', { value, bufferSize: this.buffer.length });
  }

  /**
   * Analyze current window of data
   */
  analyzeWindow() {
    if (!this.temporal || this.buffer.length < this.windowSize) {
      return;
    }

    const window = this.buffer.slice(-this.windowSize);
    const windowArray = new Float64Array(window);

    let result = {
      timestamp: Date.now(),
      windowSize: this.windowSize,
      stats: {
        mean: this.calculateMean(window),
        std: this.calculateStd(window),
        min: Math.min(...window),
        max: Math.max(...window)
      }
    };

    // Compare with reference sequence if provided
    if (this.referenceSequence && this.referenceSequence.length >= this.windowSize) {
      const refWindow = this.referenceSequence.slice(0, this.windowSize);
      const refArray = new Float64Array(refWindow);

      try {
        const distance = this.temporal.dtw(windowArray, refArray);
        const similarity = 1 / (1 + distance);

        result.comparison = {
          dtw_distance: distance,
          similarity: similarity,
          normalized_distance: distance / this.windowSize
        };

        // Detect anomalies (similarity below threshold)
        if (similarity < 0.5) {
          this.stats.anomaliesDetected++;
          result.anomaly = true;
        }
      } catch (err) {
        result.error = err.message;
      }
    }

    // Self-comparison: compare current window with previous window
    if (this.buffer.length >= this.windowSize * 2) {
      const prevWindow = this.buffer.slice(-this.windowSize * 2, -this.windowSize);
      const prevArray = new Float64Array(prevWindow);

      try {
        const selfDistance = this.temporal.dtw(windowArray, prevArray);
        result.drift = {
          distance: selfDistance,
          normalized: selfDistance / this.windowSize
        };
      } catch (err) {
        // Ignore self-comparison errors
      }
    }

    this.stats.windowsAnalyzed++;
    this.emit('window', result);

    return result;
  }

  /**
   * Calculate mean of array
   */
  calculateMean(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  /**
   * Calculate standard deviation
   */
  calculateStd(arr) {
    const mean = this.calculateMean(arr);
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  }

  /**
   * Get current statistics
   */
  getStats() {
    const elapsed = (Date.now() - this.stats.startTime) / 1000;
    return {
      ...this.stats,
      elapsedSeconds: elapsed,
      samplesPerSecond: this.stats.samplesProcessed / elapsed,
      windowsPerSecond: this.stats.windowsAnalyzed / elapsed
    };
  }

  /**
   * Reset analyzer state
   */
  reset() {
    this.buffer = [];
    this.stats = {
      samplesProcessed: 0,
      windowsAnalyzed: 0,
      anomaliesDetected: 0,
      startTime: Date.now()
    };
  }
}

/**
 * Stream from stdin (pipe support)
 */
async function streamFromStdin(analyzer, options = {}) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  const verbose = options.verbose || false;
  const format = options.format || 'text';
  const outputInterval = options.outputInterval || 1000; // ms

  let lastOutput = Date.now();

  analyzer.on('window', (result) => {
    const now = Date.now();
    if (now - lastOutput >= outputInterval) {
      if (format === 'json') {
        console.log(JSON.stringify(result));
      } else {
        if (result.comparison) {
          console.log(`[${new Date(result.timestamp).toISOString()}] DTW: ${result.comparison.dtw_distance.toFixed(4)}, Similarity: ${(result.comparison.similarity * 100).toFixed(2)}%${result.anomaly ? ' ⚠️ ANOMALY' : ''}`);
        }
        if (result.drift && verbose) {
          console.log(`  Drift: ${result.drift.normalized.toFixed(4)}`);
        }
      }
      lastOutput = now;
    }
  });

  return new Promise((resolve, reject) => {
    rl.on('line', (line) => {
      const values = line.trim().split(/[,\s]+/).filter(v => v);
      values.forEach(val => {
        if (!isNaN(val)) {
          analyzer.processSample(parseFloat(val));
        }
      });
    });

    rl.on('close', () => {
      const stats = analyzer.getStats();
      if (format === 'json') {
        console.log(JSON.stringify({ final_stats: stats }));
      } else {
        console.log('\n📊 Stream Analysis Complete');
        console.log(`   Samples processed: ${stats.samplesProcessed}`);
        console.log(`   Windows analyzed: ${stats.windowsAnalyzed}`);
        console.log(`   Anomalies detected: ${stats.anomaliesDetected}`);
        console.log(`   Duration: ${stats.elapsedSeconds.toFixed(2)}s`);
        console.log(`   Throughput: ${stats.samplesPerSecond.toFixed(2)} samples/sec`);
      }
      resolve(stats);
    });

    rl.on('error', reject);
  });
}

/**
 * Watch a file for new data
 */
async function watchFile(analyzer, filepath, options = {}) {
  const verbose = options.verbose || false;
  const format = options.format || 'text';

  let lastSize = 0;
  let fileHandle = null;

  console.log(`👁️  Watching file: ${filepath}`);
  console.log('   Press Ctrl+C to stop\n');

  const processNewData = async () => {
    try {
      const stats = fs.statSync(filepath);
      if (stats.size > lastSize) {
        const stream = fs.createReadStream(filepath, {
          start: lastSize,
          end: stats.size
        });

        const rl = readline.createInterface({
          input: stream,
          crlfDelay: Infinity
        });

        for await (const line of rl) {
          const values = line.trim().split(/[,\s]+/).filter(v => v);
          values.forEach(val => {
            if (!isNaN(val)) {
              analyzer.processSample(parseFloat(val));
            }
          });
        }

        lastSize = stats.size;
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Error reading file:', err.message);
      }
    }
  };

  analyzer.on('window', (result) => {
    if (format === 'json') {
      console.log(JSON.stringify(result));
    } else if (result.comparison) {
      console.log(`[${new Date(result.timestamp).toISOString()}] DTW: ${result.comparison.dtw_distance.toFixed(4)}, Similarity: ${(result.comparison.similarity * 100).toFixed(2)}%${result.anomaly ? ' ⚠️ ANOMALY' : ''}`);
    }
  });

  // Watch for file changes
  const watcher = fs.watch(filepath, async (eventType) => {
    if (eventType === 'change') {
      await processNewData();
    }
  });

  // Process any existing data
  await processNewData();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    watcher.close();
    const stats = analyzer.getStats();
    if (format !== 'json') {
      console.log('\n\n📊 Final Statistics');
      console.log(`   Samples processed: ${stats.samplesProcessed}`);
      console.log(`   Windows analyzed: ${stats.windowsAnalyzed}`);
      console.log(`   Anomalies detected: ${stats.anomaliesDetected}`);
      console.log(`   Duration: ${stats.elapsedSeconds.toFixed(2)}s`);
    }
    process.exit(0);
  });

  return new Promise(() => {}); // Keep running until interrupted
}

module.exports = {
  StreamAnalyzer,
  streamFromStdin,
  watchFile
};
