# Deploy KatManager lên VPS — volamchivinh.id.vn

| Thông tin | Giá trị |
|-----------|---------|
| VPS | `152.42.171.112` |
| SSH | `root@152.42.171.112` |
| Domain | `volamchivinh.id.vn` |
| Repo | [CVinh214/KatManager](https://github.com/CVinh214/KatManager) |

---

## Bước 0: DNS (quan trọng)

Trỏ bản ghi **A** của `volamchivinh.id.vn` (và `www` nếu dùng) về **`152.42.171.112`**.

Nếu domain đang trỏ **Vercel**, cần đổi sang IP VPS (hoặc tắt deploy Vercel để tránh nhầm).

Kiểm tra (trên máy bạn):

```powershell
nslookup volamchivinh.id.vn
```

Phải thấy địa chỉ `152.42.171.112`.

---

## Bước 1: Push file Docker lên GitHub

Trên máy local (thư mục `employee-management`), **chưa có trên GitHub** các file:

- `Dockerfile`, `docker-compose.yml`, `.dockerignore`
- `deploy/`
- `next.config.ts`, `prisma/schema.prisma` (đã sửa cho Docker)

```powershell
cd D:\Code\employee-management
git add Dockerfile docker-compose.yml .dockerignore deploy/ next.config.ts prisma/schema.prisma .env.example DEPLOY_GUIDE_VPS.md
git commit -m "Add Docker packaging and VPS deploy scripts"
git push origin main
```

*(Bạn có thể nhờ tôi commit giúp nếu muốn.)*

---

## Bước 2: SSH vào VPS

```powershell
ssh root@152.42.171.112
```

Lần đầu có thể hỏi mật khẩu hoặc dùng SSH key.

**Kiểm tra VPS đang chạy gì** (chạy trên VPS):

```bash
docker ps -a 2>/dev/null || echo "Chưa có Docker"
ss -tlnp | grep -E ':80|:443|:3000' || netstat -tlnp 2>/dev/null | grep -E ':80|:443|:3000'
systemctl status nginx 2>/dev/null | head -3 || echo "Chưa có Nginx"
ls -la /opt /var/www 2>/dev/null
```

Gửi output cho tôi nếu cần tránh xung đột port 80/443.

---

## Bước 3: Upload `.env` production (không commit Git)

Từ **PowerShell trên Windows** (file `.env` đã có sẵn trong project):

```powershell
scp D:\Code\employee-management\.env root@152.42.171.112:/opt/katmanager/.env
```

*Nếu thư mục chưa tồn tại, chạy Bước 4 trước rồi scp lại.*

---

## Bước 4: Chạy script cài đặt trên VPS

Trên VPS:

```bash
apt-get install -y git
git clone https://github.com/CVinh214/KatManager.git /opt/katmanager
cd /opt/katmanager
# Nếu chưa scp .env:
# (quay lại Bước 3 từ Windows)

chmod +x deploy/vps-first-boot.sh
./deploy/vps-first-boot.sh
```

Script sẽ: cài Docker, build container, cấu hình Nginx proxy tới `127.0.0.1:3000`.

---

## Bước 5: SSL HTTPS (Let's Encrypt)

**Chỉ chạy khi DNS đã trỏ đúng IP VPS** (Bước 0).

```bash
certbot --nginx -d volamchivinh.id.vn -d www.volamchivinh.id.vn --agree-tos -m email-cua-ban@gmail.com
```

Sau đó mở: **https://volamchivinh.id.vn**

---

## Bước 6: Migration database (nếu chưa chạy trên DB production)

Trên VPS (cần Node tạm hoặc chạy trong container):

```bash
cd /opt/katmanager
docker compose exec app sh -c "cd /app && npx prisma migrate deploy" 
```

Hoặc từ máy local (cùng `DATABASE_URL` trong `.env`):

```powershell
cd D:\Code\employee-management
npx prisma migrate deploy
```

---

## Cập nhật phiên bản sau này

```bash
cd /opt/katmanager
git pull
docker compose up -d --build
```

---

## Vercel

Repo hiện deploy [Vercel](https://kat-management.vercel.app). Sau khi domain trỏ VPS:

- Có thể **giữ Vercel** chỉ để preview (không gắn domain chính), hoặc
- Tắt custom domain trên Vercel để tránh trùng.

---

## Checklist nộp thi

- [ ] `Dockerfile` + `docker-compose.yml` trên GitHub
- [ ] `docker compose up` chạy trên VPS
- [ ] https://volamchivinh.id.vn mở được
- [ ] Đăng nhập app hoạt động (DB Supabase + `SESSION_SECRET`)
