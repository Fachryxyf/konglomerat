#!/usr/bin/env bash
# Redeploy Konglomerat di VM: tarik versi terbaru → install → build → restart.
# Jalankan dari dalam repo di VM:  bash deploy/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."   # ke root repo

echo "==> 1/4 Menarik perubahan terbaru (git pull)"
git pull --ff-only

echo "==> 2/4 Install dependencies"
bun install --frozen-lockfile

echo "==> 3/4 Build (next build standalone)"
bun run build

echo "==> 4/4 Restart service"
sudo systemctl restart konglomerat
sleep 1
sudo systemctl --no-pager status konglomerat | head -n 8

echo "✅ Deploy selesai."
