$ErrorActionPreference = 'Stop'

$repoDir = Join-Path $env:USERPROFILE 'stable-diffusion-webui'
$backendEnv = Join-Path $PSScriptRoot 'backend\.env'

function Write-Info($msg) { Write-Host "[info] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[warn] $msg" -ForegroundColor Yellow }
function Write-Ok($msg) { Write-Host "[ok] $msg" -ForegroundColor Green }

Write-Info 'Checking prerequisites (git + python)...'
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
$pyCmd = Get-Command python -ErrorAction SilentlyContinue

if (-not $gitCmd) {
  Write-Warn 'Git is not installed. Install with: winget install --id Git.Git -e'
  exit 1
}

if (-not $pyCmd) {
  Write-Warn 'Python is not installed. Install with: winget install --id Python.Python.3.10 -e'
  exit 1
}

Write-Info 'Cloning Stable Diffusion WebUI if missing...'
if (-not (Test-Path $repoDir)) {
  git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git $repoDir
  Write-Ok "Cloned to $repoDir"
} else {
  Write-Ok "Already exists: $repoDir"
}

$webuiUserBat = Join-Path $repoDir 'webui-user.bat'
if (-not (Test-Path $webuiUserBat)) {
  Write-Warn "Cannot find $webuiUserBat"
  exit 1
}

Write-Info 'Configuring WebUI launch args for API...'
$bat = Get-Content $webuiUserBat -Raw
if ($bat -match 'set STABLE_DIFFUSION_REPO=') {
  $bat = [Regex]::Replace($bat, 'set STABLE_DIFFUSION_REPO=.*', 'set STABLE_DIFFUSION_REPO=https://github.com/CompVis/stable-diffusion.git', 'Multiline')
} else {
  $bat += "`r`nset STABLE_DIFFUSION_REPO=https://github.com/CompVis/stable-diffusion.git`r`n"
}

if ($bat -match 'set STABLE_DIFFUSION_COMMIT_HASH=') {
  $bat = [Regex]::Replace($bat, 'set STABLE_DIFFUSION_COMMIT_HASH=.*', 'set STABLE_DIFFUSION_COMMIT_HASH=21f890f9da3cfbeaba8e2ac3c425ee9e998d5229', 'Multiline')
} else {
  $bat += "`r`nset STABLE_DIFFUSION_COMMIT_HASH=21f890f9da3cfbeaba8e2ac3c425ee9e998d5229`r`n"
}

if ($bat -match 'set COMMANDLINE_ARGS=') {
  $bat = [Regex]::Replace($bat, 'set COMMANDLINE_ARGS=.*', 'set COMMANDLINE_ARGS=--api --listen --skip-torch-cuda-test', 'Multiline')
} else {
  $bat += "`r`nset COMMANDLINE_ARGS=--api --listen --skip-torch-cuda-test`r`n"
}
Set-Content -Path $webuiUserBat -Value $bat -Encoding ASCII
Write-Ok 'Updated webui-user.bat'

if (Test-Path $backendEnv) {
  Write-Info 'Updating backend .env for local SD provider...'
  $envText = Get-Content $backendEnv -Raw

  function Upsert-EnvVar([string]$text, [string]$key, [string]$value) {
    $pattern = "(?m)^$([Regex]::Escape($key))=.*$"
    if ($text -match $pattern) {
      return [Regex]::Replace($text, $pattern, "$key=$value")
    }
    return ($text.TrimEnd() + "`r`n$key=$value`r`n")
  }

  $envText = Upsert-EnvVar $envText 'EVENT_IMAGE_PROVIDER' 'local'
  $envText = Upsert-EnvVar $envText 'LOCAL_SD_API_URL' 'http://127.0.0.1:7860/sdapi/v1/txt2img'
  $envText = Upsert-EnvVar $envText 'LOCAL_SD_TIMEOUT_MS' '45000'
  $envText = Upsert-EnvVar $envText 'LOCAL_SD_STEPS' '24'
  $envText = Upsert-EnvVar $envText 'LOCAL_SD_CFG_SCALE' '7'
  $envText = Upsert-EnvVar $envText 'LOCAL_SD_WIDTH' '1024'
  $envText = Upsert-EnvVar $envText 'LOCAL_SD_HEIGHT' '576'
  $envText = Upsert-EnvVar $envText 'LOCAL_SD_SAMPLER' 'DPM++ 2M Karras'

  Set-Content -Path $backendEnv -Value $envText -Encoding ASCII
  Write-Ok 'Updated backend/.env for local provider'
} else {
  Write-Warn 'backend/.env not found, skipped env update'
}

Write-Host ''
Write-Ok 'Setup complete.'
Write-Host 'Next:'
Write-Host "1) Start SD WebUI:   cd $repoDir ; .\webui-user.bat"
Write-Host '2) Wait until you see API ready on port 7860.'
Write-Host '3) Restart your backend server.'
Write-Host '4) Click Regenerate Banner in Events page.'
