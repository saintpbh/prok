@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: AutoBackUp - 윈도우용 missionary-map-app 백업 스크립트
:: 사용법: AutoBackUp.bat 또는 오토백업 명령어로 실행

:: 설정 변수
set "SOURCE_DIR=%~dp0"
set "BACKUP_BASE_DIR=%USERPROFILE%\Documents\backups"
set "TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "BACKUP_DIR=%BACKUP_BASE_DIR%\missionary-map-app_backup_%TIMESTAMP%"

:: PowerShell을 사용한 색상 출력 함수
call :print_logo

echo.
echo [%time%] Missionary Map App 백업을 시작합니다...
echo.

:: 소스 디렉토리 확인
call :check_source
if errorlevel 1 goto :error_exit

:: 백업 디렉토리 생성
call :create_backup_dir
if errorlevel 1 goto :error_exit

:: 파일 복사 및 백업
call :perform_backup
if errorlevel 1 goto :error_exit

:: 백업 정보 파일 생성
call :create_backup_info
if errorlevel 1 goto :error_exit

:: 압축 백업 여부 확인
set /p "compress_backup=백업을 압축하시겠습니까? (y/N): "
if /i "!compress_backup!"=="y" (
    call :create_archive
    if errorlevel 1 goto :error_exit
)

:: 이전 백업 정리
call :cleanup_old_backups

:: 완료 요약
call :show_summary

:: GitHub 푸시 실행
call :perform_github_push

:: Firebase 배포 실행
call :perform_firebase_deploy

echo.
call :show_success "모든 작업이 완료되었습니다."
pause
goto :eof

:: ========================================
:: 함수 정의
:: ========================================

:print_logo
powershell -Command "Write-Host '╔══════════════════════════════════════════════════════════════╗' -ForegroundColor Blue"
powershell -Command "Write-Host '║                        AutoBackUp                           ║' -ForegroundColor Blue"
powershell -Command "Write-Host '║                 Missionary Map App Backup                   ║' -ForegroundColor Blue"
powershell -Command "Write-Host '║                    Windows Version                          ║' -ForegroundColor Blue"
powershell -Command "Write-Host '╚══════════════════════════════════════════════════════════════╝' -ForegroundColor Blue"
goto :eof

:show_progress
powershell -Command "Write-Host '[%time%] %~1' -ForegroundColor Yellow"
goto :eof

:show_success
powershell -Command "Write-Host '✅ %~1' -ForegroundColor Green"
goto :eof

:show_error
powershell -Command "Write-Host '❌ %~1' -ForegroundColor Red"
goto :eof

:check_source
call :show_progress "소스 디렉토리 확인 중..."
if not exist "%SOURCE_DIR%" (
    call :show_error "소스 디렉토리를 찾을 수 없습니다: %SOURCE_DIR%"
    exit /b 1
)
call :show_success "소스 디렉토리 확인 완료: %SOURCE_DIR%"
goto :eof

:create_backup_dir
call :show_progress "백업 디렉토리 생성 중..."
if not exist "%BACKUP_BASE_DIR%" (
    mkdir "%BACKUP_BASE_DIR%"
    call :show_success "백업 베이스 디렉토리 생성: %BACKUP_BASE_DIR%"
)
mkdir "%BACKUP_DIR%"
call :show_success "백업 디렉토리 생성: %BACKUP_DIR%"
goto :eof

:perform_backup
call :show_progress "백업 시작..."
xcopy "%SOURCE_DIR%*" "%BACKUP_DIR%\" /E /I /H /Y /Q
if errorlevel 1 (
    call :show_error "백업 중 오류 발생"
    exit /b 1
)
call :show_success "파일 복사 완료"
goto :eof

:create_backup_info
call :show_progress "백업 정보 파일 생성 중..."
set "info_file=%BACKUP_DIR%\backup_info.txt"

echo AutoBackUp - Missionary Map App Backup Information > "%info_file%"
echo ================================================ >> "%info_file%"
echo. >> "%info_file%"
echo 백업 날짜: %date% %time% >> "%info_file%"
echo 소스 경로: %SOURCE_DIR% >> "%info_file%"
echo 백업 경로: %BACKUP_DIR% >> "%info_file%"
echo 백업 타입: 전체 백업 >> "%info_file%"
echo 시스템: Windows %OS% >> "%info_file%"
echo 사용자: %USERNAME% >> "%info_file%"
echo. >> "%info_file%"

:: 파일 통계 계산
for /f %%i in ('dir /s /b "%BACKUP_DIR%" ^| find /c /v ""') do set "file_count=%%i"
for /f %%i in ('dir /s /ad /b "%BACKUP_DIR%" ^| find /c /v ""') do set "dir_count=%%i"

echo 파일 통계: >> "%info_file%"
echo - 총 파일 수: %file_count% >> "%info_file%"
echo - 총 디렉토리 수: %dir_count% >> "%info_file%"

:: 백업 크기 계산
for /f "tokens=3" %%i in ('dir "%BACKUP_DIR%" ^| find "개 파일"') do set "backup_size=%%i"
echo - 백업 크기: %backup_size% >> "%info_file%"
echo. >> "%info_file%"
echo 백업 완료 시간: %date% %time% >> "%info_file%"

call :show_success "백업 정보 파일 생성 완료"
goto :eof

:create_archive
call :show_progress "백업 압축 중..."
set "archive_name=missionary-map-app_backup_%TIMESTAMP%.zip"
set "archive_path=%BACKUP_BASE_DIR%\%archive_name%"

powershell -Command "Compress-Archive -Path '%BACKUP_DIR%' -DestinationPath '%archive_path%' -Force"
if errorlevel 1 (
    call :show_error "압축 백업 생성 실패"
    exit /b 1
)
call :show_success "압축 백업 생성 완료: %archive_path%"

set /p "delete_original=압축이 완료되었습니다. 원본 백업 폴더를 삭제하시겠습니까? (y/N): "
if /i "!delete_original!"=="y" (
    rmdir /s /q "%BACKUP_DIR%"
    call :show_success "원본 백업 폴더 삭제 완료"
)
goto :eof

:cleanup_old_backups
call :show_progress "이전 백업 정리 중..."

:: 7일 이상 된 백업 찾기 (PowerShell 사용)
powershell -Command "Get-ChildItem '%BACKUP_BASE_DIR%' -Name 'missionary-map-app_backup_*' | Where-Object { (Get-Date) - (Get-Item '%BACKUP_BASE_DIR%\\$_').LastWriteTime -gt [TimeSpan]::FromDays(7) } | ForEach-Object { Write-Host $_ }" > temp_old_backups.txt

set "has_old_backups="
for /f %%i in (temp_old_backups.txt) do set "has_old_backups=1"

if defined has_old_backups (
    echo 7일 이상 된 백업을 발견했습니다:
    type temp_old_backups.txt
    echo.
    set /p "cleanup_confirm=이전 백업들을 삭제하시겠습니까? (y/N): "
    if /i "!cleanup_confirm!"=="y" (
        for /f %%i in (temp_old_backups.txt) do (
            rmdir /s /q "%BACKUP_BASE_DIR%\%%i" 2>nul
            del "%BACKUP_BASE_DIR%\%%i" 2>nul
        )
        call :show_success "이전 백업 정리 완료"
    )
) else (
    call :show_success "정리할 이전 백업이 없습니다"
)

del temp_old_backups.txt 2>nul
goto :eof

:show_summary
powershell -Command "Write-Host '╔══════════════════════════════════════════════════════════════╗' -ForegroundColor Blue"
powershell -Command "Write-Host '║                      백업 완료 요약                         ║' -ForegroundColor Blue"
powershell -Command "Write-Host '╚══════════════════════════════════════════════════════════════╝' -ForegroundColor Blue"

set "final_backup_path=%BACKUP_DIR%"
if /i "%compress_backup%"=="y" (
    set "final_backup_path=%BACKUP_BASE_DIR%\missionary-map-app_backup_%TIMESTAMP%.zip"
)

call :show_success "백업 성공!"
echo 백업 위치: %final_backup_path%
echo 백업 시간: %date% %time%

set /p "open_explorer=Explorer에서 백업 폴더를 열어보시겠습니까? (y/N): "
if /i "!open_explorer!"=="y" (
    explorer "%BACKUP_BASE_DIR%"
)
goto :eof

:perform_github_push
echo.
powershell -Command "Write-Host '==================================================' -ForegroundColor Yellow"
powershell -Command "Write-Host ' 🚀 GitHub 저장소 업데이트' -ForegroundColor Yellow"
powershell -Command "Write-Host '==================================================' -ForegroundColor Yellow"

:: Git 레포지토리 루트로 이동
cd /d "%SOURCE_DIR%"

:: 변경사항 확인
git status -s
echo.

set /p "confirm_push=모든 변경사항을 GitHub에 푸시하시겠습니까? (y/N): "
if /i not "!confirm_push!"=="y" (
    echo GitHub 푸시를 건너뜁니다.
    goto :eof
)

set /p "commit_message=커밋 메시지를 입력하세요 (기본: 'auto commit from script'): "
if "!commit_message!"=="" set "commit_message=auto commit from deploy script"

echo.
echo Git add...
git add .

echo Git commit...
git commit -m "!commit_message!"

echo Git push...
git push origin main

if errorlevel 1 (
    call :show_error "GitHub 푸시에 실패했습니다."
) else (
    call :show_success "GitHub에 성공적으로 푸시했습니다."
)
goto :eof

:perform_firebase_deploy
echo.
powershell -Command "Write-Host '==================================================' -ForegroundColor Yellow"
powershell -Command "Write-Host ' 🔥 Firebase 배포' -ForegroundColor Yellow"
powershell -Command "Write-Host '==================================================' -ForegroundColor Yellow"

set /p "confirm_deploy='Admin' 프로젝트를 Firebase에 배포하시겠습니까? (y/N): "
if /i not "!confirm_deploy!"=="y" (
    echo Firebase 배포를 건너뜁니다.
    goto :eof
)

:: Admin 디렉토리로 이동
cd /d "%SOURCE_DIR%Admin"

echo.
echo Firebase에 배포를 시작합니다...
firebase deploy

if errorlevel 1 (
    call :show_error "Firebase 배포에 실패했습니다."
) else (
    call :show_success "Firebase 배포가 성공적으로 완료되었습니다!"
)
goto :eof

:error_exit
call :show_error "작업이 중단되었습니다."
pause
exit /b 1

:show_help
echo AutoBackUp - Missionary Map App 백업 스크립트 (Windows)
echo.
echo 사용법:
echo   AutoBackUp.bat          # 백업 실행
echo   AutoBackUp.bat --help   # 도움말 표시
echo.
echo 기능:
echo   - missionary-map-app 전체 백업
echo   - GitHub 저장소에 변경사항 푸시 (선택)
echo   - Firebase 프로젝트 배포 (선택)
echo   - 타임스탬프 기반 백업 폴더 생성
echo   - 백업 정보 파일 자동 생성
echo   - 선택적 압축 백업 (ZIP)
echo   - 7일 이상 된 백업 자동 정리
echo.
goto :eof

:: 메인 실행
if "%1"=="--help" goto :show_help
if "%1"=="-h" goto :show_help 