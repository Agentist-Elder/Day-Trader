#!/bin/bash

# Example: Simulate streaming sensor data and analyze in real-time
# This script generates a stream of numbers and pipes them to midstreamer

echo "Simulating sensor data stream..."
echo "Normal pattern: sine wave with small variations"
echo ""

# Generate a continuous stream of sensor readings
# Sine wave pattern with some noise
for i in {1..200}; do
  # Calculate sine wave value (0-10 range)
  value=$(echo "scale=2; 5 + 5 * s($i * 0.1)" | bc -l)

  # Add small random noise
  noise=$(echo "scale=2; ($RANDOM % 100 - 50) / 100" | bc)
  final=$(echo "scale=2; $value + $noise" | bc)

  echo $final

  # Simulate real-time delay (10ms between readings)
  sleep 0.01
done | npx midstreamer stream --window 20 --slide 5 --reference "5,6,7,8,9,10,9,8,7,6,5,4,3,2,1,2,3,4,5,6"
