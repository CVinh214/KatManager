#!/usr/bin/env bash
# Chạy trên VPS (root@152.42.171.112) SAU KHI đã push Docker lên GitHub và upload .env
set -euo pipefail

DOMAIN="volamchivinh.id.vn"
APP_DIR="/opt/katmanager"
REPO="https://github.com/CVinh214/KatManager.git"

echo "==> Cập nhật hệ thống..."
apt-get update -y
apt-get upgrade -y

if ! command -v docker >/dev/null 2>&1; then
  echo "==> Cài Docker..."
  curl -fsSL https://get.docker.com | sh
fi

echo "==> Docker: $(docker --version)"
docker compose version

if ! command -v nginx >/dev/null 2>&1; then
  echo "==> Cài Nginx + Certbot..."
  apt-get install -y nginx certbot python3-certbot-nginx
fi

echo "==> Clone / cập nhật mã nguồn..."
if [[ -d "$APP_DIR/.git" ]]; then
  cd "$APP_DIR"
  git pull origin main
else
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

if [[ ! -f .env ]]; then
  echo ""
  echo "THIẾU FILE .env trong $APP_DIR"
  echo "Từ máy Windows, chạy (PowerShell):"
  echo "  scp D:\\Code\\employee-management\\.env root@152.42.171.112:$APP_DIR/.env"
  echo "Sau đó chạy lại script này."
  exit 1
fi

echo "==> Build & chạy Docker..."
docker compose up -d --build

echo "==> Cấu hình Nginx..."
cp deploy/nginx-volamchivinh.conf /etc/nginx/sites-available/katmanager
ln -sf /etc/nginx/sites-available/katmanager /etc/nginx/sites-enabled/katmanager
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t
systemctl enable nginx
systemctl reload nginx

echo ""
echo "==> Kiểm tra app nội bộ..."
sleep 8
curl -sI "http://127.0.0.1:3000/login" | head -5 || true
docker compose ps

echo ""
echo "==> SSL (chỉ chạy khi DNS đã trỏ A record $DOMAIN -> IP VPS)..."
echo "    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m YOUR_EMAIL"
echo ""
echo "Hoàn tất phần Docker + Nginx HTTP."
echo "Truy cập thử: http://$DOMAIN"
