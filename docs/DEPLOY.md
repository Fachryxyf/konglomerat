# Deploy Konglomerat ke VM (Google Cloud / Debian)

Panduan deploy ke VM Debian (mis. `e2-medium`, `asia-southeast2` Jakarta).
Arsitektur: **Caddy** (80/443, HTTPS otomatis) → reverse proxy → **app** di
`127.0.0.1:3737` yang dijaga **systemd**.

> Ganti `USER` di bawah dengan user VM-mu (jalankan `whoami`), dan `example.com`
> dengan domainmu.

---

## 0. Prasyarat (di konsol GCP)
- Firewall: **Allow HTTP** + **Allow HTTPS** aktif (port 80 & 443).
- **Static external IP** sudah di-reserve & menempel ke VM.
- (Untuk HTTPS) **Domain** dengan A record → IP statis VM. Belum punya domain? Bisa tes via HTTP/IP dulu (lihat §5).

## 1. SSH masuk
```bash
gcloud compute ssh --zone "asia-southeast2-b" "game-monopoly" --project "project-80fe547c-5549-4441-98b"
```

## 2. Pasang dependensi sistem
```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install git curl ufw

# Bun (toolchain build & runtime)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc        # agar `bun` ada di PATH
bun --version
```

## 3. Ambil kode & build
```bash
cd ~
git clone https://github.com/Fachryxyf/game-monopoly.git
cd game-monopoly
bun install --frozen-lockfile
bun run build           # next build (standalone) + salin static/public
```

## 4. Jalankan sebagai service (systemd)
```bash
# isi placeholder __USER__ dgn user-mu, lalu pasang
sed "s/__USER__/$(whoami)/g" deploy/konglomerat.service | sudo tee /etc/systemd/system/konglomerat.service >/dev/null

sudo systemctl daemon-reload
sudo systemctl enable --now konglomerat
sudo systemctl status konglomerat --no-pager      # harus "active (running)"
curl -I http://127.0.0.1:3737                     # harus dapat respons HTTP
```
> Jika `bun` tidak di `~/.bun/bin/bun`, cek `which bun` dan sesuaikan `ExecStart`.

## 5. Reverse proxy + HTTPS (Caddy)
```bash
# install Caddy (repo resmi)
sudo apt -y install debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt -y install caddy

# pasang config (ganti example.com dgn domainmu lebih dulu di file)
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile      # set domainmu
sudo systemctl reload caddy
```
**Tanpa domain (tes cepat):** edit `/etc/caddy/Caddyfile` pakai blok `:80 { … }`
(lihat komentar di file), lalu akses `http://IP_VM`.

## 6. Firewall (ufw)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw --force enable
sudo ufw status
```
Port **3737 tidak dibuka** — app hanya bind ke localhost, diakses lewat Caddy.

## 7. Selesai
Buka `https://example.com` (atau `http://IP_VM`).

---

## Update / redeploy (sesudah push baru ke GitHub)
```bash
cd ~/game-monopoly
bash deploy/deploy.sh        # git pull → install → build → restart
```

## Log & troubleshooting
```bash
journalctl -u konglomerat -f          # log app (live)
sudo journalctl -u caddy -f           # log Caddy / HTTPS
sudo systemctl restart konglomerat    # restart app
```
- HTTPS gagal terbit? Pastikan DNS A record sudah propagasi & port 80/443 terbuka (Caddy butuh 80 untuk ACME).
- Build kehabisan RAM di VM kecil? Tambah swap, atau build lokal/CI lalu kirim artefak.
