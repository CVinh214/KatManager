# Script PowerShell để push code lên GitHub

Write-Host "🚀 Bắt đầu push code lên GitHub..." -ForegroundColor Cyan

# Kiểm tra có thay đổi không
$status = git status --porcelain
if ([string]::IsNullOrEmpty($status)) {
    Write-Host "✅ Không có thay đổi nào để commit" -ForegroundColor Green
    exit 0
}

# Hiển thị các file sẽ được commit
Write-Host ""
Write-Host "📝 Các file sẽ được commit:" -ForegroundColor Yellow
git status --short

# Xác nhận
Write-Host ""
$confirm = Read-Host "Bạn có muốn tiếp tục? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Đã hủy" -ForegroundColor Red
    exit 1
}

# Nhập commit message
$commitMsg = Read-Host "Nhập commit message"

# Add all files
git add .

# Commit
git commit -m $commitMsg

# Push
Write-Host ""
Write-Host "⬆️ Đang push lên GitHub..." -ForegroundColor Cyan
git push

Write-Host ""
Write-Host "✅ Đã push code thành công!" -ForegroundColor Green
Write-Host "🌐 Vercel sẽ tự động build và deploy trong vài phút" -ForegroundColor Cyan
