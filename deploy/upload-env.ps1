# Upload .env production len VPS (khong commit len Git)
# Chay: powershell -File deploy/upload-env.ps1

$Vps = "root@152.42.171.112"
$LocalEnv = Join-Path $PSScriptRoot "..\.env"
$RemotePath = "/opt/katmanager/.env"

if (-not (Test-Path $LocalEnv)) {
  Write-Error "Khong tim thay .env tai $LocalEnv"
  exit 1
}

Write-Host "Upload .env -> $Vps:$RemotePath"
scp $LocalEnv "${Vps}:${RemotePath}"
Write-Host "Xong. Kiem tra tren VPS: ssh $Vps 'test -f $RemotePath && echo OK'"
