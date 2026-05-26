# Hướng dẫn Triển khai VPS với Docker

Triển khai ứng dụng **KatManager / employee-management** lên VPS bằng Docker Compose, kèm domain và HTTPS (theo quy chế thi).

## Yêu cầu

| Hạng mục | Ghi chú |
|----------|---------|
| VPS | Ubuntu 22.04+ (hoặc tương đương), RAM ≥ 1GB |
| Docker + Compose | Plugin `docker compose` v2 |
| Database | Supabase PostgreSQL (`DATABASE_URL` + `DIRECT_URL`) |
| Domain | Trỏ A record về IP VPS |
| SSL | Cloudflare Proxy **hoặc** Nginx + Certbot |

## File Docker trong repo

- `Dockerfile` — multi-stage build (deps → builder → runner), Prisma trên Alpine
- `docker-compose.yml` — service `app`, bind `127.0.0.1:3000` (chỉ Nginx/Cloudflare ra ngoài)
- `.dockerignore` — loại file thừa khi build
- `deploy/nginx-employee-management.conf` — mẫu reverse proxy
- `deploy/vps-setup.sh` — script build & chạy trên VPS

---

## Bước 1: Cài Docker trên VPS (Ubuntu)

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

Đăng xuất SSH và đăng nhập lại để group `docker` có hiệu lực.

---

## Bước 2: Đưa mã nguồn lên VPS

**Cách A — Git (khuyên dùng):**

```bash
cd ~
git clone https://github.com/YOUR_USER/employee-management.git
cd employee-management
```

**Cách B — SCP từ máy Windows:**

```powershell
scp -r D:\Code\employee-management user@VPS_IP:~/employee-management
```

---

## Bước 3: Tạo file `.env` trên VPS

```bash
cp .env.example .env
nano .env
```

Điền tối thiểu:

- `DATABASE_URL` — Supabase pooler (port **6543**, `?pgbouncer=true`)
- `DIRECT_URL` — Supabase direct (port **5432**)
- `SESSION_SECRET` — chuỗi ngẫu nhiên dài (bắt buộc production)
- `GEMINI_API_KEY_1` (và 2, 3 nếu có)
- `NEXT_PUBLIC_SUPABASE_*` nếu client cần
- `VAPID_*` nếu dùng push notification

**Không** commit `.env` lên Git.

Chạy migration (một lần, từ VPS hoặc máy local có `.env` trỏ cùng DB):

```bash
npx prisma migrate deploy
```

---

## Bước 4: Build và chạy container

```bash
chmod +x deploy/vps-setup.sh
./deploy/vps-setup.sh
```

Hoặc thủ công:

```bash
docker compose up -d --build
docker compose logs -f app
```

Kiểm tra nội bộ VPS:

```bash
curl -I http://127.0.0.1:3000/login
```

---

## Bước 5: Domain & HTTPS

### Cách 1: Cloudflare (nhanh, phù hợp demo thi)

1. Thêm domain vào Cloudflare.
2. Bản ghi **A**: `@` và/hoặc `www` → **IP VPS**.
3. Bật **Proxy** (đám mây vàng).
4. SSL/TLS → **Full** (khuyên dùng) hoặc Flexible nếu chưa có cert trên VPS.
5. Truy cập `https://yourdomain.com` — Cloudflare cấp SSL.

Ứng dụng vẫn listen `127.0.0.1:3000`. Nếu chỉ dùng Cloudflare Flexible, có thể mở port 3000 ra IP (tùy chọn) hoặc thêm Nginx proxy local.

**Khuyên cho production:** Cloudflare **Full** + Nginx trên VPS (Cách 2).

### Cách 2: Nginx + Let's Encrypt trên VPS

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
sudo cp deploy/nginx-employee-management.conf /etc/nginx/sites-available/employee-management
sudo nano /etc/nginx/sites-available/employee-management
# Đổi YOUR_DOMAIN → tên miền thật
sudo ln -sf /etc/nginx/sites-available/employee-management /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Bước 6: Cập nhật phiên bản mới

```bash
cd ~/employee-management
git pull
docker compose up -d --build
```

---

## Xử lý sự cố

| Triệu chứng | Gợi ý |
|-------------|--------|
| Container restart liên tục | `docker compose logs app` — thiếu `SESSION_SECRET` hoặc `DATABASE_URL` sai |
| Prisma / DB lỗi | Kiểm tra Supabase allow IP; `DIRECT_URL` cho migrate, `DATABASE_URL` cho app |
| 502 từ Nginx | `docker compose ps` — app phải healthy; `curl http://127.0.0.1:3000/login` |
| Build chậm / hết RAM | VPS ≥ 2GB RAM hoặc thêm swap |

---

## Checklist nộp thi (Docker + VPS)

- [ ] Có `Dockerfile` + `docker-compose.yml`
- [ ] Chạy được trên VPS (`docker compose up -d`)
- [ ] Domain trỏ đúng IP
- [ ] Truy cập được **HTTPS**
- [ ] `.env` không lộ trên Git

---

*Liên hệ: nếu cần hỗ trợ deploy trực tiếp, cung cấp IP VPS, user SSH, domain và xác nhận repo Git (hoặc upload code).*
