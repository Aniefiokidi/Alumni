# Alumni Platform Setup Script
# This script helps you set up the Alumni Management Platform

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Alumni Platform Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if MongoDB is installed
Write-Host "Checking MongoDB installation..." -ForegroundColor Yellow
try {
    $mongoVersion = mongod --version
    Write-Host "✓ MongoDB is installed" -ForegroundColor Green
} catch {
    Write-Host "⚠ MongoDB might not be installed or not in PATH. Please ensure MongoDB is installed." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up Backend..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Backend setup
Set-Location backend

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backend dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created. Please update it with your configurations." -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up Frontend..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Frontend setup
Set-Location frontend

Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Frontend dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    "VITE_API_URL=http://localhost:5000/api" | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✓ .env file created" -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Make sure MongoDB is running" -ForegroundColor White
Write-Host "2. Update backend/.env with your configurations" -ForegroundColor White
Write-Host "3. Start the backend:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host "4. In a new terminal, start the frontend:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "For more information, check README.md" -ForegroundColor Cyan
Write-Host ""
