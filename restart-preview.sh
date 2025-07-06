#!/bin/bash
# Kill existing preview server
lsof -ti:4173 | xargs kill -9 2>/dev/null || true
sleep 1
# Start new preview server
pnpm serve --port 4173 &
echo "Preview server restarted on http://localhost:4173"