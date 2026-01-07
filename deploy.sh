#!/bin/bash
# Script để push code lên GitHub

echo "🚀 Bắt đầu push code lên GitHub..."

# Kiểm tra có thay đổi không
if [ -z "$(git status --porcelain)" ]; then 
  echo "✅ Không có thay đổi nào để commit"
  exit 0
fi

# Hiển thị các file sẽ được commit
echo ""
echo "📝 Các file sẽ được commit:"
git status --short

# Xác nhận
read -p "Bạn có muốn tiếp tục? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Đã hủy"
    exit 1
fi

# Nhập commit message
read -p "Nhập commit message: " commit_msg

# Add all files
git add .

# Commit
git commit -m "$commit_msg"

# Push
echo ""
echo "⬆️ Đang push lên GitHub..."
git push

echo ""
echo "✅ Đã push code thành công!"
echo "🌐 Vercel sẽ tự động build và deploy trong vài phút"
