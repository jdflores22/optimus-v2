# Deploy Optimus V2 frontend to Hostinger via git orphan branch (not SCP).
#
# Flow:
#   1. Build frontend/optimus-web/dist
#   2. Force-push contents to origin/hostinger
#   3. SSH: git fetch + reset in public_html
#
# Setup (once):
#   copy deploy-config.ps1.example deploy-config.ps1
#   fill SshPassword (and GitHubToken if the repo is private)
#
# Usage:
#   .\deploy.ps1
#   .\deploy.ps1 -SkipBuild
#   .\deploy.ps1 -SkipGitPush
#   .\deploy.ps1 -UseScp
#   .\deploy.ps1 -UsePassword

param(
    [switch]$SkipBuild,
    [switch]$SkipGitPush,
    [switch]$Full,
    [switch]$UsePassword,
    [switch]$UseScp,
    [int]$BatchMaxKb = 1200
)

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\scripts\deploy-common.ps1"

$config = Get-DeployConfig
$usePassword = $UsePassword.IsPresent -or -not [string]::IsNullOrWhiteSpace($config.SshPassword)

$frontend = Join-Path $PSScriptRoot 'frontend\optimus-web'
$dist = Join-Path $frontend 'dist'
$manifestPath = Join-Path $PSScriptRoot 'scripts\.hostinger-deploy-manifest.json'

if (-not $SkipBuild) {
    Write-Host ("Building frontend (API: {0})..." -f $config.ApiBaseUrl) -ForegroundColor Cyan
    $envContent = "VITE_API_BASE_URL=$($config.ApiBaseUrl)"
    Set-Content -Path (Join-Path $frontend '.env.production') -Value $envContent -Encoding utf8

    Push-Location $frontend
    try {
        $env:VITE_API_BASE_URL = $config.ApiBaseUrl
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw 'npm run build failed'
        }
    }
    finally {
        Pop-Location
    }
} else {
    Write-Host 'Skipping build (using existing frontend/optimus-web/dist).' -ForegroundColor DarkGray
}

if (-not (Test-Path $dist)) {
    throw "Build output not found: $dist"
}

Write-Host ''

if ($UseScp) {
    Write-Host 'Using SCP fallback (batched upload)...' -ForegroundColor Yellow
    Test-DeploySsh -Config $config -UsePassword:$usePassword

    Write-Host 'Comparing local dist/ to last deploy manifest...' -ForegroundColor Cyan
    $current = Get-DistFileHashes -DistRoot $dist
    $previous = if ($Full) { @{} } else { Read-DeployManifest -Path $manifestPath }

    $toUpload = @()
    foreach ($rel in ($current.Keys | Sort-Object)) {
        if ($Full -or -not $previous.ContainsKey($rel) -or $previous[$rel] -ne $current[$rel]) {
            $toUpload += $rel
        }
    }

    Write-Host ("  Local files: {0}" -f $current.Count) -ForegroundColor DarkGray
    Write-Host ("  Upload:      {0} new/changed" -f $toUpload.Count) -ForegroundColor DarkGray

    if ($toUpload.Count -eq 0) {
        Write-Host 'Nothing to upload - Hostinger is already up to date.' -ForegroundColor Green
    } else {
        Invoke-DeployBundle -Config $config -LocalRoot $dist -RelativeFiles $toUpload -MaxBatchBytes ($BatchMaxKb * 1KB)
        Save-DeployManifest -Path $manifestPath -Map $current
        Write-Host ("Saved deploy manifest: {0}" -f $manifestPath) -ForegroundColor DarkGray
        Write-Host 'Hostinger frontend deploy complete.' -ForegroundColor Green
    }
} else {
    Publish-HostingerGitBranch -Config $config -RepoRoot $PSScriptRoot -DistRoot $dist

    Test-DeploySsh -Config $config -UsePassword:$usePassword
    Invoke-HostingerGitPull -Config $config

    $current = Get-DistFileHashes -DistRoot $dist
    Save-DeployManifest -Path $manifestPath -Map $current
    Write-Host ("Saved deploy manifest: {0}" -f $manifestPath) -ForegroundColor DarkGray
    Write-Host 'Hostinger frontend deploy complete.' -ForegroundColor Green
}

Write-Host ''

if (-not $SkipGitPush) {
    $dirty = git status --porcelain
    if ($dirty) {
        Write-Host 'Warning: uncommitted local changes will NOT reach Railway until you commit and push.' -ForegroundColor Yellow
        $dirty | ForEach-Object { Write-Host ("  {0}" -f $_) -ForegroundColor DarkYellow }
        Write-Host ''
    }

    $branch = if ($config.GitBranch) { $config.GitBranch } else { git rev-parse --abbrev-ref HEAD }
    Write-Host ("Pushing {0} to origin (Railway API auto-redeploys)..." -f $branch) -ForegroundColor Cyan
    git push origin $branch
    if ($LASTEXITCODE -ne 0) {
        throw 'git push failed'
    }
    Write-Host 'Git push complete.' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Production deploy complete.' -ForegroundColor Green
Write-Host ("  Frontend: {0}" -f $config.AppUrl)
Write-Host ("  API:      {0}" -f $config.ApiBaseUrl)
Write-Host ("  Hostinger branch: origin/{0}" -f $config.HostingerGitBranch)
