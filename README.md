# Hệ Thống Quản Lý Nhân Viên & Lịch Làm Việc

Ứng dụng web quản lý nhân viên và lịch làm việc được xây dựng với Next.js 16+, TypeScript, Tailwind CSS, Prisma và Supabase.

## 🚀 Công Nghệ Sử Dụng

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 5.22.0
- **State Management**: Zustand (với localStorage persistence)
- **Form Management**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Utils**: date-fns
- **CSV Export**: PapaParse
- **AI**: Google Gemini API (3 keys load balancing)

## 📦 Cài Đặt & Chạy Local

```bash
# Clone repository
git clone <your-repo-url>
cd employee-management

# Cài đặt dependencies
npm install
# hoặc
pnpm install

# Copy file .env.example thành .env và điền thông tin
cp .env.example .env

# Chạy Prisma migrations
npx prisma generate
npx prisma db push

# Seed database với dữ liệu mẫu (optional)
# Truy cập: http://localhost:3000/api/seed

# Chạy development server
npm run dev
# hoặc
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

## 🌐 Deploy lên Vercel

### Bước 1: Chuẩn bị Database
1. Tạo tài khoản [Supabase](https://supabase.com)
2. Tạo project mới và lấy thông tin:
   - Database URL (Transaction Pooler - port 6543)
   - Direct URL (Session Pooler - port 5432)
   - Supabase URL và Publishable Key

### Bước 2: Deploy
1. Push code lên GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. Truy cập [Vercel](https://vercel.com)
3. Import project từ GitHub
4. Thêm Environment Variables:
   - `DATABASE_URL`: Transaction Pooler URL
   - `DIRECT_URL`: Session Pooler URL
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`: Publishable key
   - `GEMINI_API_KEY_1`: Google Gemini API key 1
   - `GEMINI_API_KEY_2`: Google Gemini API key 2
   - `GEMINI_API_KEY_3`: Google Gemini API key 3

5. Deploy!

### Bước 3: Seed Database (Production)
Sau khi deploy xong, truy cập: `https://your-app.vercel.app/api/seed` để tạo dữ liệu mẫu.

## 🔑 Lấy API Keys

### Supabase
1. Truy cập [Supabase Dashboard](https://app.supabase.com)
2. Chọn project → Settings → Database
3. Copy Connection Pooler URLs (Transaction mode port 6543, Session mode port 5432)
4. Chọn Settings → API → Copy Supabase URL và Publishable Key

### Google Gemini API
1. Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Tạo 3 API keys khác nhau để load balancing
3. Copy và paste vào `.env`

## 🔐 Tài Khoản Demo

### Quản lý (Manager)
- **Email**: admin@company.com
- **Password**: 123
- **Quyền**: Xem tất cả, CRUD nhân viên, chỉnh lịch, xem báo cáo

### Nhân viên (Staff)
- **Email**: staff@company.com
- **Password**: 123
- **Quyền**: Xem lịch cá nhân, đăng ký ca, ghi giờ công

## 📱 Chức Năng Chính

### 1. 🏠 Dashboard
- **Manager**: Xem tổng quan nhân viên, ca làm, giờ công
- **Staff**: Xem lịch cá nhân, thống kê giờ làm

### 2. 👥 Quản Lý Nhân Viên (Manager Only)
- ➕ Thêm nhân viên mới
- ✏️ Chỉnh sửa thông tin
- 🗑️ Xóa nhân viên
- 🔍 Tìm kiếm theo tên, mã, email
- 📋 Quản lý vị trí: Cashier, Barista, Kitchen Staff, Server

### 3. 📅 Lịch Làm Việc
**Manager:**
- Xem lịch tuần theo dạng calendar
- Phân công ca làm (Sáng 8-12h, Chiều 14-18h, Tối 18-22h)
- Chỉnh sửa/xóa ca đã phân
- Duyệt yêu cầu đăng ký ca

**Staff:**
- Xem lịch làm của mình
- Đăng ký ca trống
- Xem trạng thái ca (đã duyệt/chờ)

### 4. ⏰ Giờ Công
**Manager:**
- Xem tổng giờ công tất cả nhân viên
- Filter theo vị trí (ví dụ: Cashier)
- Filter theo nhân viên
- Tính toán tự động

**Staff:**
- Ghi nhận giờ công cá nhân
- Nhập giờ vào/ra thực tế
- Thêm ghi chú

### 5. 📊 Báo Cáo (Manager Only)
- 📈 Biểu đồ cột: Giờ công theo nhân viên
- 🥧 Biểu đồ tròn: Phân bổ theo vị trí
- 📑 Bảng chi tiết: Tổng giờ, số ca, trung bình
- 📥 Xuất CSV: Tải báo cáo
- 🎯 Filter: Tuần/tháng/tất cả

## 💾 Lưu Trữ

Dữ liệu lưu trong **localStorage** (mock data cho demo):
- `auth-storage`: Thông tin đăng nhập
- `employee-storage`: Danh sách nhân viên
- `shift-storage`: Lịch làm việc
- `timelog-storage`: Giờ công

## 🎨 UI Features

- ✅ Responsive design
- ✅ Sidebar navigation role-based
- ✅ Modal forms + validation
- ✅ Search & filter
- ✅ Interactive charts
- ✅ CSV export

## 📄 License

MIT License

---

**Lưu ý**: Đây là demo với mock data. Production cần database thực tế.
