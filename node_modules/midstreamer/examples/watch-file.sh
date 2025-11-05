#!/bin/bash

# Example: Watch a file for new data and analyze in real-time
# This script simulates a log file being written by a sensor

LOG_FILE="/tmp/sensor_stream.log"

# Clean up old log file
rm -f "$LOG_FILE"
touch "$LOG_FILE"

echo "Starting file watcher on $LOG_FILE"
echo "Simulating sensor writing to file..."
echo ""

# Start the watcher in background
npx midstreamer watch "$LOG_FILE" --window 10 --slide 3 &
WATCHER_PID=$!

# Give watcher time to start
sleep 1

# Simulate sensor writing data to file
for i in {1..50}; do
  # Generate random sensor reading (0-100)
  value=$((RANDOM % 100))
  echo $value >> "$LOG_FILE"
  echo "Wrote value: $value"
  sleep 0.5
done

# Wait a bit for final processing
sleep 2

# Stop the watcher
kill $WATCHER_PID 2>/dev/null

echo ""
echo "File watching demonstration complete"
