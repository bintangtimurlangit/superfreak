#!/usr/bin/env bash
# Run from superfreak (frontend) directory on your VPS.
# Uses current branch for git pull (e.g. staging). Ensure .env exists.

set -e
cd "$(dirname "$0")"

echo "📥 Pull latest code..."
git pull

echo "🐳 Building and starting containers..."
docker compose up -d --build

echo "✅ Frontend deploy done. App: http://$(hostname -I | awk '{print $1}'):3000"
