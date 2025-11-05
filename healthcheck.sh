#!/bin/sh

# Neural Trading System - Health Check Script
# Used by Docker and Kubernetes for container health monitoring

set -e

# Configuration
HOST="${HOST:-localhost}"
PORT="${PORT:-3000}"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-/health}"
TIMEOUT=3

# Perform health check
if command -v curl > /dev/null 2>&1; then
    # Use curl if available
    response=$(curl -sf --max-time $TIMEOUT "http://${HOST}:${PORT}${HEALTH_ENDPOINT}" || echo "FAILED")
elif command -v wget > /dev/null 2>&1; then
    # Fall back to wget
    response=$(wget -q -O- --timeout=$TIMEOUT "http://${HOST}:${PORT}${HEALTH_ENDPOINT}" || echo "FAILED")
else
    # Use Node.js as last resort (always available in our container)
    response=$(node -e "
        const http = require('http');
        const options = {
            hostname: '${HOST}',
            port: ${PORT},
            path: '${HEALTH_ENDPOINT}',
            method: 'GET',
            timeout: ${TIMEOUT}000
        };
        const req = http.request(options, (res) => {
            if (res.statusCode === 200) {
                console.log('healthy');
                process.exit(0);
            } else {
                console.log('unhealthy');
                process.exit(1);
            }
        });
        req.on('error', () => {
            console.log('error');
            process.exit(1);
        });
        req.on('timeout', () => {
            req.destroy();
            console.log('timeout');
            process.exit(1);
        });
        req.end();
    " 2>/dev/null)
fi

# Check response
if [ "$response" = "FAILED" ] || [ -z "$response" ]; then
    echo "Health check failed"
    exit 1
fi

# Verify response contains expected data
if echo "$response" | grep -q "healthy"; then
    echo "Health check passed"
    exit 0
else
    echo "Health check returned unexpected response"
    exit 1
fi
