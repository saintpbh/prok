# AutoBackUp.ps1 - 윈도우용 missionary-map-app 백업 스크립트 (PowerShell)
# 사용법: .\AutoBackUp.ps1 또는 오토백업 명령어로 실행

param(
    [switch]$Help,
    [switch]$Silent,
    [switch]$AutoCompress,
    [switch]$AutoPush,
    [switch]$AutoDeploy
)

# 색상 정의
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
    Magenta = "Magenta"
    White = "White"
}

# 설정 변수
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourceDir = $ScriptDir
$BackupBaseDir = Join-Path $env:USERPROFILE "Documents\backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir = Join-Path $BackupBaseDir "missionary-map-app_backup_$Timestamp"

# 로고 출력
function Show-Logo {
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor $Colors.Blue
    Write-Host "║                        AutoBackUp                           ║" -ForegroundColor $Colors.Blue
    Write-Host "║                 Missionary Map App Backup                   ║" -ForegroundColor $Colors.Blue
    Write-Host "║                  PowerShell Version                         ║" -ForegroundColor $Colors.Blue
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor $Colors.Blue
}

# 진행 상황 표시
function Show-Progress {
    param([string]$Message)
    $time = Get-Date -Format "HH:mm:ss"
    Write-Host "[$time] $Message" -ForegroundColor $Colors.Yellow
}

# 성공 메시지
function Show-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Colors.Green
}

# 에러 메시지
function Show-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Colors.Red
}

# 경고 메시지
function Show-Warning {
    param([string]$Message)
    Write-Host "⚠️ $Message" -ForegroundColor $Colors.Yellow
}

# 정보 메시지
function Show-Info {
    param([string]$Message)
    Write-Host "ℹ️ $Message" -ForegroundColor $Colors.Cyan
}

# 소스 디렉토리 확인
function Test-SourceDirectory {
    Show-Progress "소스 디렉토리 확인 중..."
    
    if (-not (Test-Path $SourceDir)) {
        Show-Error "소스 디렉토리를 찾을 수 없습니다: $SourceDir"
        return $false
    }
    
    Show-Success "소스 디렉토리 확인 완료: $SourceDir"
    return $true
}

# 백업 디렉토리 생성
function New-BackupDirectory {
    Show-Progress "백업 디렉토리 생성 중..."
    
    if (-not (Test-Path $BackupBaseDir)) {
        New-Item -ItemType Directory -Path $BackupBaseDir -Force | Out-Null
        Show-Success "백업 베이스 디렉토리 생성: $BackupBaseDir"
    }
    
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Show-Success "백업 디렉토리 생성: $BackupDir"
}

# 파일 복사 및 백업
function Start-Backup {
    Show-Progress "백업 시작..."
    
    try {
        # Robocopy를 사용한 효율적인 백업 (Windows 내장)
        $robocopyArgs = @(
            $SourceDir,
            $BackupDir,
            "/E",        # 모든 하위 디렉토리 포함
            "/COPY:DAT", # 데이터, 속성, 타임스탬프 복사
            "/R:3",      # 재시도 3회
            "/W:1",      # 재시도 간 대기 1초
            "/TEE",      # 콘솔과 로그 파일에 출력
            "/NP",       # 진행률 표시 안함
            "/NDL"       # 디렉토리 목록 표시 안함
        )
        
        $result = & robocopy @robocopyArgs
        
        # Robocopy 성공 코드 확인 (0-7은 성공)
        if ($result -le 7) {
            Show-Success "파일 복사 완료"
            return $true
        } else {
            Show-Error "백업 중 오류 발생 (코드: $result)"
            return $false
        }
    }
    catch {
        Show-Error "백업 중 예외 발생: $($_.Exception.Message)"
        return $false
    }
}

# 백업 정보 파일 생성
function New-BackupInfo {
    Show-Progress "백업 정보 파일 생성 중..."
    
    $infoFile = Join-Path $BackupDir "backup_info.txt"
    $fileCount = (Get-ChildItem -Path $BackupDir -Recurse -File).Count
    $dirCount = (Get-ChildItem -Path $BackupDir -Recurse -Directory).Count
    $backupSize = (Get-ChildItem -Path $BackupDir -Recurse | Measure-Object -Property Length -Sum).Sum
    
    $backupInfo = @"
AutoBackUp - Missionary Map App Backup Information
================================================

백업 날짜: $(Get-Date -Format "yyyy년 MM월 dd일 HH시 mm분 ss초")
소스 경로: $SourceDir
백업 경로: $BackupDir
백업 타입: 전체 백업
시스템: Windows $($env:OS) $([Environment]::OSVersion.Version)
사용자: $env:USERNAME
PowerShell 버전: $($PSVersionTable.PSVersion)

파일 통계:
- 총 파일 수: $fileCount
- 총 디렉토리 수: $dirCount
- 백업 크기: $([math]::Round($backupSize / 1MB, 2)) MB

백업 완료 시간: $(Get-Date -Format "yyyy년 MM월 dd일 HH시 mm분 ss초")
"@
    
    $backupInfo | Out-File -FilePath $infoFile -Encoding UTF8
    Show-Success "백업 정보 파일 생성 완료"
}

# 압축 백업 생성
function New-CompressedBackup {
    Show-Progress "백업 압축 중..."
    
    $archiveName = "missionary-map-app_backup_$Timestamp.zip"
    $archivePath = Join-Path $BackupBaseDir $archiveName
    
    try {
        Compress-Archive -Path $BackupDir -DestinationPath $archivePath -Force
        Show-Success "압축 백업 생성 완료: $archivePath"
        
        if (-not $Silent) {
            $deleteOriginal = Read-Host "압축이 완료되었습니다. 원본 백업 폴더를 삭제하시겠습니까? (y/N)"
            if ($deleteOriginal -eq 'y' -or $deleteOriginal -eq 'Y') {
                Remove-Item -Path $BackupDir -Recurse -Force
                Show-Success "원본 백업 폴더 삭제 완료"
                return $archivePath
            }
        }
        return $BackupDir
    }
    catch {
        Show-Error "압축 백업 생성 실패: $($_.Exception.Message)"
        return $BackupDir
    }
}

# 이전 백업 정리
function Remove-OldBackups {
    Show-Progress "이전 백업 정리 중..."
    
    $cutoffDate = (Get-Date).AddDays(-7)
    $oldBackups = Get-ChildItem -Path $BackupBaseDir -Name "missionary-map-app_backup_*" | 
                  Where-Object { (Get-Item (Join-Path $BackupBaseDir $_)).LastWriteTime -lt $cutoffDate }
    
    if ($oldBackups) {
        Show-Warning "7일 이상 된 백업을 발견했습니다:"
        $oldBackups | ForEach-Object { Write-Host "  $_" -ForegroundColor $Colors.Yellow }
        
        if (-not $Silent) {
            $cleanupConfirm = Read-Host "이전 백업들을 삭제하시겠습니까? (y/N)"
            if ($cleanupConfirm -eq 'y' -or $cleanupConfirm -eq 'Y') {
                foreach ($backup in $oldBackups) {
                    $backupPath = Join-Path $BackupBaseDir $backup
                    if (Test-Path $backupPath) {
                        Remove-Item -Path $backupPath -Recurse -Force -ErrorAction SilentlyContinue
                    }
                }
                Show-Success "이전 백업 정리 완료"
            }
        }
    } else {
        Show-Success "정리할 이전 백업이 없습니다"
    }
}

# 백업 완료 요약
function Show-BackupSummary {
    param([string]$FinalBackupPath)
    
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor $Colors.Blue
    Write-Host "║                      백업 완료 요약                         ║" -ForegroundColor $Colors.Blue
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor $Colors.Blue
    
    Show-Success "백업 성공!"
    Write-Host "백업 위치: $FinalBackupPath"
    Write-Host "백업 시간: $(Get-Date -Format 'yyyy년 MM월 dd일 HH시 mm분 ss초')"
    
    if (Test-Path $FinalBackupPath) {
        $size = (Get-ChildItem -Path $FinalBackupPath -Recurse | Measure-Object -Property Length -Sum).Sum
        Write-Host "백업 크기: $([math]::Round($size / 1MB, 2)) MB"
    }
    
    if (-not $Silent) {
        $openExplorer = Read-Host "Explorer에서 백업 폴더를 열어보시겠습니까? (y/N)"
        if ($openExplorer -eq 'y' -or $openExplorer -eq 'Y') {
            Start-Process "explorer.exe" -ArgumentList $BackupBaseDir
        }
    }
}

# GitHub 푸시
function Push-ToGitHub {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor $Colors.Yellow
    Write-Host " 🚀 GitHub 저장소 업데이트" -ForegroundColor $Colors.Yellow
    Write-Host "==================================================" -ForegroundColor $Colors.Yellow
    
    # Git 레포지토리 루트로 이동
    Set-Location $SourceDir
    
    # 변경사항 확인
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "변경된 파일들:" -ForegroundColor $Colors.Cyan
        $gitStatus | ForEach-Object { Write-Host "  $_" -ForegroundColor $Colors.White }
        Write-Host ""
        
        if (-not $Silent -and -not $AutoPush) {
            $confirmPush = Read-Host "모든 변경사항을 GitHub에 푸시하시겠습니까? (y/N)"
            if ($confirmPush -ne 'y' -and $confirmPush -ne 'Y') {
                Show-Info "GitHub 푸시를 건너뜁니다."
                return
            }
        }
        
        $commitMessage = if (-not $Silent -and -not $AutoPush) {
            Read-Host "커밋 메시지를 입력하세요 (기본: 'auto commit from script')"
        } else {
            "auto commit from deploy script"
        }
        
        if ([string]::IsNullOrWhiteSpace($commitMessage)) {
            $commitMessage = "auto commit from deploy script"
        }
        
        Write-Host ""
        Show-Progress "Git add..."
        git add .
        
        Show-Progress "Git commit..."
        git commit -m $commitMessage
        
        Show-Progress "Git push..."
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Show-Success "GitHub에 성공적으로 푸시했습니다."
        } else {
            Show-Error "GitHub 푸시에 실패했습니다."
        }
    } else {
        Show-Info "변경된 파일이 없습니다."
    }
}

# Firebase 배포
function Deploy-ToFirebase {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor $Colors.Yellow
    Write-Host " 🔥 Firebase 배포" -ForegroundColor $Colors.Yellow
    Write-Host "==================================================" -ForegroundColor $Colors.Yellow
    
    $adminDir = Join-Path $SourceDir "Admin"
    
    if (-not (Test-Path $adminDir)) {
        Show-Error "Admin 디렉토리를 찾을 수 없습니다: $adminDir"
        return
    }
    
    if (-not $Silent -and -not $AutoDeploy) {
        $confirmDeploy = Read-Host "'Admin' 프로젝트를 Firebase에 배포하시겠습니까? (y/N)"
        if ($confirmDeploy -ne 'y' -and $confirmDeploy -ne 'Y') {
            Show-Info "Firebase 배포를 건너뜁니다."
            return
        }
    }
    
    Set-Location $adminDir
    
    Write-Host ""
    Show-Progress "Firebase에 배포를 시작합니다..."
    firebase deploy
    
    if ($LASTEXITCODE -eq 0) {
        Show-Success "Firebase 배포가 성공적으로 완료되었습니다!"
    } else {
        Show-Error "Firebase 배포에 실패했습니다."
    }
}

# 도움말 표시
function Show-Help {
    Write-Host "AutoBackUp - Missionary Map App 백업 스크립트 (PowerShell)" -ForegroundColor $Colors.Cyan
    Write-Host ""
    Write-Host "사용법:" -ForegroundColor $Colors.Yellow
    Write-Host "  .\AutoBackUp.ps1                    # 기본 백업 실행"
    Write-Host "  .\AutoBackUp.ps1 -Silent            # 자동 모드 (사용자 입력 없음)"
    Write-Host "  .\AutoBackUp.ps1 -AutoCompress      # 자동 압축"
    Write-Host "  .\AutoBackUp.ps1 -AutoPush          # 자동 GitHub 푸시"
    Write-Host "  .\AutoBackUp.ps1 -AutoDeploy        # 자동 Firebase 배포"
    Write-Host "  .\AutoBackUp.ps1 -Help              # 도움말 표시"
    Write-Host ""
    Write-Host "매개변수:" -ForegroundColor $Colors.Yellow
    Write-Host "  -Silent        자동 모드 (사용자 입력 없이 실행)"
    Write-Host "  -AutoCompress  백업 자동 압축"
    Write-Host "  -AutoPush      GitHub 자동 푸시"
    Write-Host "  -AutoDeploy    Firebase 자동 배포"
    Write-Host "  -Help          도움말 표시"
    Write-Host ""
    Write-Host "기능:" -ForegroundColor $Colors.Yellow
    Write-Host "  - missionary-map-app 전체 백업"
    Write-Host "  - GitHub 저장소에 변경사항 푸시 (선택)"
    Write-Host "  - Firebase 프로젝트 배포 (선택)"
    Write-Host "  - 타임스탬프 기반 백업 폴더 생성"
    Write-Host "  - 백업 정보 파일 자동 생성"
    Write-Host "  - 선택적 압축 백업 (ZIP)"
    Write-Host "  - 7일 이상 된 백업 자동 정리"
    Write-Host "  - 진행률 표시 및 색상 출력"
    Write-Host ""
}

# 메인 실행 함수
function Start-AutoBackup {
    Show-Logo
    
    Write-Host "Missionary Map App 백업을 시작합니다..." -ForegroundColor $Colors.Blue
    Write-Host ""
    
    # 소스 디렉토리 확인
    if (-not (Test-SourceDirectory)) {
        exit 1
    }
    
    # 백업 디렉토리 생성
    New-BackupDirectory
    
    # 백업 실행
    if (-not (Start-Backup)) {
        exit 1
    }
    
    # 백업 정보 생성
    New-BackupInfo
    
    # 압축 백업 여부 확인
    $finalBackupPath = $BackupDir
    if ($AutoCompress -or (-not $Silent -and (Read-Host "백업을 압축하시겠습니까? (y/N)") -eq 'y')) {
        $finalBackupPath = New-CompressedBackup
    }
    
    # 이전 백업 정리
    Remove-OldBackups
    
    # 완료 요약
    Show-BackupSummary -FinalBackupPath $finalBackupPath
    
    # GitHub 푸시
    if ($AutoPush -or -not $Silent) {
        Push-ToGitHub
    }
    
    # Firebase 배포
    if ($AutoDeploy -or -not $Silent) {
        Deploy-ToFirebase
    }
    
    Write-Host ""
    Show-Success "모든 작업이 완료되었습니다."
}

# 스크립트 실행
if ($Help) {
    Show-Help
} else {
    Start-AutoBackup
} 