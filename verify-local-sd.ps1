$ErrorActionPreference = 'Stop'

try {
  $options = Invoke-RestMethod -Uri 'http://127.0.0.1:7860/sdapi/v1/options' -Method Get
  Write-Host '[ok] Local SD API is online at 127.0.0.1:7860' -ForegroundColor Green
  if ($options.sd_model_checkpoint) {
    Write-Host "[info] Active model: $($options.sd_model_checkpoint)" -ForegroundColor Cyan
  }
} catch {
  Write-Host '[error] Local SD API is not reachable. Start webui-user.bat with --api first.' -ForegroundColor Red
  exit 1
}

$payload = @{
  prompt = 'cinematic alumni event venue, no text, no logo, photoreal'
  negative_prompt = 'text, letters, logo, watermark, blurry'
  width = 640
  height = 384
  steps = 12
  cfg_scale = 7
  sampler_name = 'DPM++ 2M Karras'
  batch_size = 1
  n_iter = 1
} | ConvertTo-Json -Depth 4

try {
  $resp = Invoke-RestMethod -Uri 'http://127.0.0.1:7860/sdapi/v1/txt2img' -Method Post -ContentType 'application/json' -Body $payload
  if ($resp.images -and $resp.images.Count -gt 0) {
    Write-Host '[ok] txt2img works. Your app can generate Local AI banners now.' -ForegroundColor Green
  } else {
    Write-Host '[warn] API responded but no image data returned.' -ForegroundColor Yellow
  }
} catch {
  Write-Host "[error] txt2img failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
