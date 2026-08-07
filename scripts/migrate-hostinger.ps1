# Run EF migrations + seed against Hostinger MySQL from your PC.
#
# Usage:
#   $env:OPTIMUS_MYSQL_PASSWORD = 'your-mysql-password'
#   .\scripts\migrate-hostinger.ps1
#
# Hostname from Hostinger phpMyAdmin: h5g5-db.hstgr.io

param(
    [string]$MySqlHost = 'h5g5-db.hstgr.io',
    [string]$Database = 'u910121167_61mLrRkFt_OV2',
    [string]$User = 'u910121167_61mLrRkFt_OV2',
    [string]$Password = $env:OPTIMUS_MYSQL_PASSWORD
)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent

if ([string]::IsNullOrWhiteSpace($Password)) {
    $secure = Read-Host "MySQL password for $User" -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

$conn = "Server=$MySqlHost;Port=3306;Database=$Database;User=$User;Password=$Password;CharSet=utf8mb4;SslMode=Preferred;"
Write-Host "Migrating $Database on $MySqlHost ..." -ForegroundColor Cyan

$env:ConnectionStrings__Default = $conn
Push-Location (Join-Path $root 'src\Optimus.Api')
try {
    dotnet run -- --migrate-only
    if ($LASTEXITCODE -ne 0) {
        throw 'Migration failed'
    }
    Write-Host 'Migration and seed complete.' -ForegroundColor Green
}
finally {
    Pop-Location
    Remove-Item Env:ConnectionStrings__Default -ErrorAction SilentlyContinue
}
