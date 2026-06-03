#!/usr/bin/env bash
set -euo pipefail

# Replace these values before using this file as EC2 user data.
REPO_URL="https://github.com/YOUR_GITHUB_USER/containerized-node.js-app.git"
APP_DIR="/opt/containerized-node.js-app"

apt-get update -y
apt-get install -y ca-certificates curl git

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

rm -rf "$APP_DIR"
git clone "$REPO_URL" "$APP_DIR"
cd "$APP_DIR"

cat > .env <<'ENVEOF'
PORT=8090
MONGO_URI=mongodb://mongo:27017/devopsdb
REDIS_HOST=redis
REDIS_PORT=6379
ENVEOF

docker compose up -d --build
