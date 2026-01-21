# Hệ Thống Quản Lý Nhân Viên & Lịch Làm Việc

# KatManager — Hệ Thống Quản Lý Nhân Viên & Lịch Làm Việc

Ứng dụng demo để quản lý nhân viên, phân ca, ghi giờ công và thông báo nội bộ.

Phiên bản nhánh: `main` — cập nhật: 2026-01-22

Tổng quan
- Ứng dụng demo để quản lý nhân viên, phân ca, ghi giờ công và thông báo nội bộ.
- Xây dựng với Next.js (App Router), TypeScript, Tailwind CSS.
- Bao gồm tính năng PWA cơ bản (manifest + hướng dẫn cài trên mobile) và trải nghiệm thông báo (banner hướng dẫn bật thông báo trên mobile).

Mục tiêu README này
- Cung cấp tổng quan hiện trạng mã nguồn.
- Hướng dẫn nhanh để chạy, build và kiểm tra các tính năng mobile/PWA.

Cấu trúc chính
- `src/app/` — App Router pages & routes.
   - `src/app/dashboard/page.tsx` — Dashboard (quick actions, thông báo banner trên mobile).
   - `src/app/settings-mobile/page.tsx` — Trang hướng dẫn cài PWA (iOS/Android, chọn trình duyệt, các bước).
   - `src/app/layout.tsx` — Metadata, manifest và icons được khai báo.
- `src/components/` — Component tái sử dụng.
- `src/lib/` — utilities (api-client, push-notification, date-utils, ...).
- `src/store/` — Zustand stores (auth, user, employee, timelog).
- `public/` — assets tĩnh, manifest và icon PWA (`manifest.json`, `icon-192.png`, `icon-512.png`, `icons/*`).
- `prisma/` — schema + migrations (nếu dùng Prisma).
- `scripts/generate-icons.js` — helper để sinh PNG từ SVG (dùng `sharp`).

Công nghệ chính
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma (optional)
- Zustand (state)
- Lucide React (icons)
- Vitest (config present)

Quickstart — phát triển local
1) Cài dependencies
```bash
pnpm install    # hoặc npm install
```

2) Tạo file môi trường
```bash
cp .env.example .env
# chỉnh các biến cần thiết (DATABASE_URL, NEXT_PUBLIC_*, GEMINI_API_KEY_*, ...)
```

3) (Nếu dùng Prisma)
```bash
npx prisma generate
npx prisma db push
```

4) Sinh icon (khi thay đổi SVG nguồn)
```bash
pnpm run generate-icons
```

5) Chạy dev server
```bash
pnpm dev
```

6) Build production
```bash
pnpm build
```

PWA & Mobile Notes
- Manifest: `public/manifest.json` — kiểm tra `name`, `icons`, `display`.
- Icons: `public/icon-192.png`, `public/icon-512.png`, `public/icons/*`.
- Trang hướng dẫn PWA: `src/app/settings-mobile/page.tsx` (hướng dẫn theo trình duyệt).
- Dashboard có banner thông báo non-blocking: chỉ hiển thị trên mobile khi quyền thông báo chưa được cấp; không hiển thị trên desktop.

Environment variables (gợi ý)
- `DATABASE_URL` — Postgres
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — nếu dùng Supabase
- `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3` — (optional)

Scripts (ví dụ từ `package.json`)
- `pnpm dev` — phát triển
- `pnpm build` — build production
- `pnpm run generate-icons` — tạo PNG icon từ SVG
- `pnpm test` — chạy tests (nếu có cấu hình)

Kiểm tra & Deploy
- Chạy `pnpm build` để kiểm tra lỗi TypeScript/Next.js trước khi deploy.
- Triển khai lên Vercel hoặc host hỗ trợ Next.js App Router; cấu hình environment variables trên môi trường deploy.

Việc cần làm / Gợi ý cải tiến
- Kiểm tra giao diện và hướng dẫn `src/app/settings-mobile/page.tsx` trên iOS/Android thực tế.
- Thay thế icon bằng assets chất lượng cao.
- Dọn dẹp cảnh báo TypeScript/lint trước production.
- Thêm test (Vitest) và CI (GitHub Actions).

Tệp liên quan nhanh
- [src/app/settings-mobile/page.tsx](src/app/settings-mobile/page.tsx)
- [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)
- [public/manifest.json](public/manifest.json)
- [scripts/generate-icons.js](scripts/generate-icons.js)
- [prisma/schema.prisma](prisma/schema.prisma)
---

*Ghi chú:* README này là bản tóm tắt hiện trạng;
