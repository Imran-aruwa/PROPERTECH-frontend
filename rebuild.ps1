# Next.js Cache Clear and Rebuild Script
# This script clears cache and restarts the development server

Write-Host "Clearing Next.js cache..." -ForegroundColor Cyan

# Delete .next folder
if (Test-Path ".\.next") {
    Write-Host "  Removing .next folder..."
    Remove-Item -Recurse -Force ".\.next" -ErrorAction SilentlyContinue
    Write-Host "  [OK] .next folder deleted" -ForegroundColor Green
} else {
    Write-Host "  [INFO] .next folder not found" -ForegroundColor Yellow
}

# Delete node_modules/.cache folder
if (Test-Path ".\node_modules\.cache") {
    Write-Host "  Removing node_modules/.cache folder..."
    Remove-Item -Recurse -Force ".\node_modules\.cache" -ErrorAction SilentlyContinue
    Write-Host "  [OK] node_modules/.cache folder deleted" -ForegroundColor Green
} else {
    Write-Host "  [INFO] node_modules/.cache folder not found" -ForegroundColor Yellow
}

Write-Host "`nBuilding project..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[OK] Build completed successfully" -ForegroundColor Green

Write-Host "`nStarting development server..." -ForegroundColor Cyan
npm run dev

Write-Host "`n[OK] Dev server is running." -ForegroundColor Green