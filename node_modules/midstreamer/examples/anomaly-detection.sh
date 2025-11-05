#!/bin/bash

# Example: Real-time anomaly detection
# Generates normal data with injected anomalies

echo "Real-time Anomaly Detection Example"
echo "====================================="
echo ""
echo "Normal pattern: values around 50"
echo "Anomalies: sudden spikes > 80 or drops < 20"
echo ""

# Reference sequence (normal behavior)
REFERENCE="45,48,52,50,49,51,50,48,52,51,50,49,48,50,52,51,49,50,48,52"

{
  # Generate normal data for first 30 samples
  for i in {1..30}; do
    value=$((45 + RANDOM % 10))
    echo $value
    sleep 0.05
  done

  # Inject anomaly 1: spike
  echo "95"
  sleep 0.05
  echo "92"
  sleep 0.05
  echo "88"
  sleep 0.05

  # Back to normal
  for i in {1..20}; do
    value=$((45 + RANDOM % 10))
    echo $value
    sleep 0.05
  done

  # Inject anomaly 2: drop
  echo "15"
  sleep 0.05
  echo "12"
  sleep 0.05
  echo "18"
  sleep 0.05

  # Back to normal
  for i in {1..30}; do
    value=$((45 + RANDOM % 10))
    echo $value
    sleep 0.05
  done
} | npx midstreamer stream --window 20 --slide 5 --reference "$REFERENCE" --verbose

echo ""
echo "✓ Anomaly detection complete"
echo "Check for ⚠️ ANOMALY warnings in output above"
