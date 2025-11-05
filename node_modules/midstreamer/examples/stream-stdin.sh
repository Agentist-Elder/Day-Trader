#!/bin/bash

# Example: Stream data from stdin
# Usage: cat data.csv | ./stream-stdin.sh

echo "Reading stream from stdin..."
echo "Format: comma or space-separated numbers"
echo "Example: echo '1 2 3 4 5 6 7 8' | npx midstreamer stream"
echo ""

# Simple example - pipe numbers to stream analyzer
echo "1 2 3 4 5 6 7 8 9 10" | npx midstreamer stream --window 5 --slide 2

# More realistic example with continuous data
# seq 1 100 | npx midstreamer stream --window 20 --format json
