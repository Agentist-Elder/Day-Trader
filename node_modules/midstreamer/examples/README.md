# Midstreamer Streaming Examples

This directory contains examples demonstrating real-time streaming analysis capabilities.

## Examples

### 1. Stream from stdin
```bash
chmod +x stream-stdin.sh
./stream-stdin.sh
```

Basic stdin streaming example showing how to pipe data to the analyzer.

**Use cases:**
- Processing command output
- Analyzing generated sequences
- Quick testing and prototyping

### 2. Sensor Data Stream
```bash
chmod +x stream-sensor-data.sh
./stream-sensor-data.sh
```

Simulates a real sensor streaming data (sine wave pattern with noise). Compares against reference pattern to detect deviations.

**Use cases:**
- IoT sensor monitoring
- Real-time signal processing
- Pattern matching in continuous data

### 3. File Watching
```bash
chmod +x watch-file.sh
./watch-file.sh
```

Monitors a file for new data and analyzes as it's written. Simulates a log file being updated by a sensor.

**Use cases:**
- Log file monitoring
- Tail-like analysis with DTW
- Continuous file processing

### 4. Anomaly Detection
```bash
chmod +x anomaly-detection.sh
./anomaly-detection.sh
```

Real-time anomaly detection by comparing streaming data against a reference pattern. Injects anomalies to demonstrate detection.

**Use cases:**
- System health monitoring
- Fraud detection in transaction streams
- Quality control in manufacturing
- Network traffic analysis

## Command Reference

### Stream Command
```bash
npx midstreamer stream [options]
```

Reads from stdin and performs windowed DTW analysis.

**Options:**
- `--window <n>` - Window size (default: 100)
- `--slide <n>` - Sliding step (default: 10)
- `--reference <seq>` - Reference sequence for comparison
- `--format json|text` - Output format
- `--interval <ms>` - Output interval (default: 1000ms)
- `--verbose` - Show detailed metrics

**Example:**
```bash
seq 1 1000 | npx midstreamer stream --window 50 --slide 10
```

### Watch Command
```bash
npx midstreamer watch <file> [options]
```

Watches a file and analyzes new data as it's appended.

**Options:**
- `--window <n>` - Window size (default: 100)
- `--slide <n>` - Sliding step (default: 10)
- `--reference <seq>` - Reference sequence for comparison
- `--format json|text` - Output format
- `--verbose` - Show detailed metrics

**Example:**
```bash
npx midstreamer watch /var/log/sensor.log --window 20 --reference "1,2,3,4,5"
```

## Output Format

### Text Output (Default)
```
[2025-01-27T10:30:45.123Z] DTW: 12.3456, Similarity: 89.45%
[2025-01-27T10:30:46.234Z] DTW: 15.6789, Similarity: 85.32% ⚠️ ANOMALY
```

### JSON Output
```json
{
  "timestamp": 1706352645123,
  "windowSize": 20,
  "stats": {
    "mean": 50.2,
    "std": 5.4,
    "min": 42,
    "max": 58
  },
  "comparison": {
    "dtw_distance": 12.3456,
    "similarity": 0.8945,
    "normalized_distance": 0.6173
  },
  "drift": {
    "distance": 8.2,
    "normalized": 0.41
  },
  "anomaly": false
}
```

## Advanced Usage

### Multi-Source Analysis
```bash
# Compare two live data streams
mkfifo stream1 stream2
sensor1 > stream1 &
sensor2 > stream2 &
paste stream1 stream2 | npx midstreamer stream --window 50
```

### Real-time Dashboard
```bash
# JSON output for dashboard integration
tail -f /var/log/metrics.log | npx midstreamer stream --format json --window 30 | jq .
```

### Continuous Monitoring
```bash
# Monitor system metrics
while true; do
  vmstat 1 1 | tail -1 | awk '{print $15}'
done | npx midstreamer stream --window 60 --reference "95,96,95,97,96"
```

## Performance

Streaming analysis performance:
- **Window size 100**: ~1000 samples/sec
- **Window size 500**: ~200 samples/sec
- **Memory usage**: ~O(window_size) constant memory
- **Latency**: < 10ms per window analysis

## Tips

1. **Window Size**: Larger windows = more context but slower processing
2. **Slide Size**: Smaller slides = more frequent updates but higher CPU usage
3. **Reference Sequence**: Should represent "normal" behavior for anomaly detection
4. **Output Interval**: Balance between real-time feedback and console spam
5. **Format**: Use JSON for programmatic integration, text for human monitoring

## Troubleshooting

**No output appearing:**
- Check that data is being streamed (unbuffered pipes)
- Ensure window is filled (need enough samples)
- Try smaller window size

**High CPU usage:**
- Increase slide size (less frequent analysis)
- Reduce window size
- Increase output interval

**Memory issues:**
- Reduce window size (buffer is 2x window)
- Only one window kept in memory at a time

## Next Steps

- Add WebSocket support for network streams
- Implement multi-sequence comparison
- Add statistical process control (SPC) charts
- Create alerting thresholds
