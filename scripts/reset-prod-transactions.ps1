# Reset all transactional data on Hostinger production MySQL.
#
# Preserves users, shipping lines, terminals, regions, and platform settings.
# Re-seeds demo yard containers via DbSeeder after wipe.
#
# Usage:
#   $env:OPTIMUS_MYSQL_PASSWORD = 'your-mysql-password'
#   .\scripts\reset-prod-transactions.ps1
#
# Or call the live API after deploy (System Admin JWT):
#   POST https://optimus-v2-copy-production.up.railway.app/api/maintenance/reset-transactions

param(
    [string]$MySqlHost = 'h5g5-db.hstgr.io',
    [string]$Database = 'u910121167_61mLrRkFt_OV2',
    [string]$User = 'u910121167_61mLrRkFt_OV2',
    [string]$Password = $env:OPTIMUS_MYSQL_PASSWORD,
    [switch]$SkipSeed
)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent

if ([string]::IsNullOrWhiteSpace($Password)) {
    $secure = Read-Host "MySQL password for $User" -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

Write-Host "WARNING: This will delete ALL transactional data in $Database on $MySqlHost." -ForegroundColor Red
Write-Host "Users and platform config will be preserved." -ForegroundColor Yellow
$confirm = Read-Host "Type RESET to continue"
if ($confirm -ne 'RESET') {
    Write-Host 'Aborted.' -ForegroundColor Yellow
    exit 1
}

$conn = "Server=$MySqlHost;Port=3306;Database=$Database;User=$User;Password=$Password;CharSet=utf8mb4;SslMode=Preferred;AllowPublicKeyRetrieval=True;"
Write-Host "Resetting transactional data..." -ForegroundColor Cyan

$env:ConnectionStrings__Default = $conn
Push-Location (Join-Path $root 'src\Optimus.Api')
try {
    dotnet run -- --reset-transactions
    if ($LASTEXITCODE -ne 0) {
        throw 'Transaction reset failed'
    }
    Write-Host 'Production transaction reset complete.' -ForegroundColor Green
}
finally {
    Pop-Location
    Remove-Item Env:ConnectionStrings__Default -ErrorAction SilentlyContinue
}
