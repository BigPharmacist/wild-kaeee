#!/bin/bash

# Start Kaeee webapp with Caddy reverse proxy
cd "$(dirname "$0")"

# Start Vite dev server in background
npm run dev &
VITE_PID=$!

# Wait for Vite to start
sleep 3

# Start Caddy reverse proxy
~/caddy run --config ~/Caddyfile &
CADDY_PID=$!

echo ""
echo "==================================="
echo "  Kaeee is running!"
echo "==================================="
echo ""
echo "  Local:   http://localhost:5173"
echo "  Extern:  http://195.201.231.116:8080"
echo ""
echo "  Press Ctrl+C to stop"
echo ""

# Cleanup on exit
cleanup() {
    echo "Stopping..."
    kill $VITE_PID 2>/dev/null
    kill $CADDY_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
