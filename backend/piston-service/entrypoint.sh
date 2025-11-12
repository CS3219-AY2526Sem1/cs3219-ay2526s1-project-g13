#!/bin/bash
set -e

# Function to handle shutdown
cleanup() {
    echo "Shutting down..."
    kill -TERM "$piston_pid" 2>/dev/null || true
    wait "$piston_pid" 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# Determine the piston command - try common locations
PISTON_CMD="/piston/piston"
if [ ! -f "$PISTON_CMD" ]; then
    PISTON_CMD="piston"
fi

# Start piston in the background
echo "Starting Piston API with command: $PISTON_CMD server"
$PISTON_CMD server &
piston_pid=$!

# Wait for piston to be ready (check health endpoint)
echo "Waiting for Piston API to be ready..."
max_attempts=30
attempt=0
until curl -s -o /dev/null "http://localhost:2000/api/v2/runtimes"; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "ERROR: Piston API did not start within expected time"
        kill -TERM "$piston_pid" 2>/dev/null || true
        exit 1
    fi
    if ! kill -0 $piston_pid 2>/dev/null; then
        echo "ERROR: Piston process died unexpectedly"
        exit 1
    fi
    echo "Waiting for Piston API... (attempt $attempt/$max_attempts)"
    sleep 2
done
echo "Piston API is ready!"

# Install languages in the background (non-blocking)
echo "Starting language installation process..."
/init-languages.sh &

# Keep the container running by waiting for the piston process
wait $piston_pid

