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

function Show-ManualRailwayVars {
    param($Settings)
    Write-Host 'Set these in Railway → Service → Variables, then redeploy:' -ForegroundColor Yellow
    Write-Host "Smtp__Host=$($Settings.Host)"
    Write-Host "Smtp__Port=$($Settings.Port)"
    Write-Host "Smtp__User=$($Settings.User)"
    Write-Host "Smtp__Password=$($Settings.Password)"
    Write-Host "Smtp__FromEmail=$($Settings.FromEmail)"
    Write-Host "Smtp__FromName=$($Settings.FromName)"
    Write-Host "Smtp__UseSsl=$($Settings.UseSsl)"
    Write-Host "App__PublicUrl=$($Settings.PublicUrl)"
}

$railwayCmd = if (Get-Command railway -ErrorAction SilentlyContinue) { 'railway' } else { 'npx --yes @railway/cli' }

if ($railwayCmd -like 'npx*') {
    Write-Host 'Using npx @railway/cli for Railway variables...' -ForegroundColor DarkGray
}

$statusOutput = Invoke-Expression "$railwayCmd status 2>&1" | Out-String
if ($LASTEXITCODE -ne 0 -or $statusOutput -match 'No linked project') {
    Write-Host 'Railway CLI is not linked to a project.' -ForegroundColor Yellow
    Show-ManualRailwayVars -Settings $config
    exit 0
}

Write-Host 'Setting Railway SMTP variables...' -ForegroundColor Cyan
Invoke-Expression "$railwayCmd variables set `"Smtp__Host=$($config.Host)`""
Invoke-Expression "$railwayCmd variables set `"Smtp__Port=$($config.Port)`""
Invoke-Expression "$railwayCmd variables set `"Smtp__User=$($config.User)`""
Invoke-Expression "$railwayCmd variables set `"Smtp__Password=$($config.Password)`""
Invoke-Expression "$railwayCmd variables set `"Smtp__FromEmail=$($config.FromEmail)`""
Invoke-Expression "$railwayCmd variables set `"Smtp__FromName=$($config.FromName)`""
Invoke-Expression "$railwayCmd variables set `"Smtp__UseSsl=$($config.UseSsl)`""
Invoke-Expression "$railwayCmd variables set `"App__PublicUrl=$($config.PublicUrl)`""
Write-Host 'Done. Redeploy the API service on Railway.' -ForegroundColor Green
