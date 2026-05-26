#!/usr/bin/env bash
# Run on VPS (Ubuntu) from project root after cloning and creating .env
set -euo pipefail

if [[ ! -f .env ]]; then
  echo "Missing .env — copy from .env.example and fill in values first."
  exit 1
fi

echo "==> Building and starting containers..."
docker compose up -d --build

echo "==> Waiting for healthcheck..."
sleep 5
docker compose ps

echo "==> Recent logs:"
docker compose logs --tail=30 app

echo ""
echo "App should be on http://127.0.0.1:3000"
echo "Configure Nginx (deploy/nginx-employee-management.conf) or Cloudflare for HTTPS."
