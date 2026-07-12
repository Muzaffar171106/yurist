#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/yurist-ai}"
REPO_URL="${REPO_URL:-https://github.com/Muzaffar171106/yurist.git}"
BRANCH="${BRANCH:-main}"

sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg git nginx

if ! command -v docker >/dev/null 2>&1; then
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

sudo usermod -aG docker "$USER"

sudo mkdir -p "$APP_DIR"
sudo chown "$USER":"$USER" "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
fi

sudo cp deploy/aws/nginx-yurist-ai.conf /etc/nginx/sites-available/yurist-ai
sudo ln -sf /etc/nginx/sites-available/yurist-ai /etc/nginx/sites-enabled/yurist-ai
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

docker compose -f deploy/aws/docker-compose.prod.yml up -d --build

echo "Yurist AI backend started."
echo "Health: http://SERVER_IP/api/health"
echo "Swagger: http://SERVER_IP/api/docs"
