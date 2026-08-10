# Apply smtp-config.ps1 to Railway service variables (requires Railway CLI linked to project).
#
# Usage:
#   copy smtp-config.ps1.example smtp-config.ps1   # fill Password
#   .\scripts\sync-smtp-railway.ps1

param(
    [string]$ConfigPath = (Join-Path (Split-Path $PSScriptRoot -Parent) 'smtp-config.ps1')
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $ConfigPath)) {
    throw "Missing $ConfigPath — copy smtp-config.ps1.example to smtp-config.ps1 and set Password."
}

$config = & $ConfigPath
if ([string]::IsNullOrWhiteSpace($config.Password)) {
    throw 'smtp-config.ps1 Password is empty.'
}

if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host 'Railway CLI not found. Set these in Railway → Variables manually:' -ForegroundColor Yellow
    Write-Host "Smtp__Host=$($config.Host)"
    Write-Host "Smtp__Port=$($config.Port)"
    Write-Host "Smtp__User=$($config.User)"
    Write-Host 'Smtp__Password=<your-mailbox-password>'
    Write-Host "Smtp__FromEmail=$($config.FromEmail)"
    Write-Host "Smtp__FromName=$($config.FromName)"
    Write-Host "Smtp__UseSsl=$($config.UseSsl)"
    Write-Host "App__PublicUrl=$($config.PublicUrl)"
    exit 0
}

Write-Host 'Setting Railway SMTP variables...' -ForegroundColor Cyan
railway variables set "Smtp__Host=$($config.Host)"
railway variables set "Smtp__Port=$($config.Port)"
railway variables set "Smtp__User=$($config.User)"
railway variables set "Smtp__Password=$($config.Password)"
railway variables set "Smtp__FromEmail=$($config.FromEmail)"
railway variables set "Smtp__FromName=$($config.FromName)"
railway variables set "Smtp__UseSsl=$($config.UseSsl)"
railway variables set "App__PublicUrl=$($config.PublicUrl)"
Write-Host 'Done. Redeploy the API service on Railway.' -ForegroundColor Green
