# 기장선교지도 프로젝트 전체 백업 스크립트
# PowerShell 버전

param(
    [string]$BackupName = "",
    [switch]$Help
)

# 도움말 표시
if ($Help) {
    Write-Host @"
기장선교지도 프로젝트 백업 스크립트

사용법:
    .\backup-all.ps1                    # 자동으로 날짜시간으로 백업
    .\backup-all.ps1 -BackupName "v1.0" # 지정한 이름으로 백업
    .\backup-all.ps1 -Help              # 도움말 표시

예시:
    .\backup-all.ps1
    .\backup-all.ps1 -BackupName "국가별리스트_완성"
    .\backup-all.ps1 -BackupName "기도팝업_수정완료"
"@
    exit 0
}

# 현재 시간으로 백업 폴더명 생성
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
if ($BackupName -eq "") {
    $backupFolder = "BackUp_$timestamp"
} else {
    $backupFolder = "BackUp_${BackupName}_$timestamp"
}

Write-Host "🚀 기장선교지도 프로젝트 백업을 시작합니다..." -ForegroundColor Green
Write-Host "📁 백업 폴더: $backupFolder" -ForegroundColor Yellow

# 백업 폴더 생성
try {
    New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null
    Write-Host "✅ 백업 폴더 생성 완료" -ForegroundColor Green
} catch {
    Write-Host "❌ 백업 폴더 생성 실패: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 백업할 폴더 목록
$folders = @(
    "Admin",
    "PcWeb", 
    "Mobile",
    "css",
    "js",
    "pdfs",
    "dailyreport",
    "prok"
)

# 백업할 파일 확장자 목록
$fileExtensions = @(
    "*.html",
    "*.json", 
    "*.md",
    "*.txt",
    "*.svg",
    "*.bat",
    "*.ps1",
    "*.sh",
    "*.js",
    "*.css"
)

# 폴더 백업
Write-Host "📂 폴더 백업 중..." -ForegroundColor Cyan
foreach ($folder in $folders) {
    if (Test-Path $folder) {
        try {
            Copy-Item -Path $folder -Destination $backupFolder -Recurse -Force
            Write-Host "  ✅ $folder" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ $folder - $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠️  $folder (폴더 없음)" -ForegroundColor Yellow
    }
}

# 파일 백업
Write-Host "📄 파일 백업 중..." -ForegroundColor Cyan
foreach ($extension in $fileExtensions) {
    $files = Get-ChildItem -Path "." -Filter $extension -File
    foreach ($file in $files) {
        try {
            Copy-Item -Path $file.FullName -Destination $backupFolder -Force
            Write-Host "  ✅ $($file.Name)" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# 백업 완료 통계
$backupItems = Get-ChildItem -Path $backupFolder -Recurse | Measure-Object
$backupSize = (Get-ChildItem -Path $backupFolder -Recurse | Measure-Object -Property Length -Sum).Sum

Write-Host ""
Write-Host "🎉 백업 완료!" -ForegroundColor Green
Write-Host "📊 백업 통계:" -ForegroundColor Yellow
Write-Host "  📁 폴더: $backupFolder"
Write-Host "  📄 파일 수: $($backupItems.Count)개"
Write-Host "  💾 크기: $([math]::Round($backupSize / 1MB, 2)) MB"
Write-Host "  ⏰ 시간: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# 백업 폴더 열기 옵션
$openFolder = Read-Host "백업 폴더를 열까요? (y/n)"
if ($openFolder -eq "y" -or $openFolder -eq "Y") {
    Start-Process "explorer.exe" -ArgumentList $backupFolder
}

Write-Host "✅ Backup completed successfully!" -ForegroundColor Green 