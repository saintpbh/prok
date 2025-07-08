@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 기장선교지도 프로젝트 전체 백업 스크립트
REM Windows Batch 버전

REM 인수 처리
set "BACKUP_NAME=%1"
if "%BACKUP_NAME%"=="-h" goto :help
if "%BACKUP_NAME%"=="--help" goto :help

REM 현재 시간으로 백업 폴더명 생성
for /f "tokens=1-6 delims=/:. " %%a in ('echo %date% %time%') do (
    set "YEAR=%%c"
    set "MONTH=%%a"
    set "DAY=%%b"
    set "HOUR=%%d"
    set "MINUTE=%%e"
    set "SECOND=%%f"
)

REM 시간 형식 정리 (한 자리 수 앞에 0 추가)
if %MONTH% LSS 10 set "MONTH=0%MONTH%"
if %DAY% LSS 10 set "DAY=0%DAY%"
if %HOUR% LSS 10 set "HOUR=0%HOUR%"
if %MINUTE% LSS 10 set "MINUTE=0%MINUTE%"
if %SECOND% LSS 10 set "SECOND=0%SECOND%"

set "TIMESTAMP=%YEAR%%MONTH%%DAY%_%HOUR%%MINUTE%%SECOND%"

if "%BACKUP_NAME%"=="" (
    set "BACKUP_FOLDER=BackUp_%TIMESTAMP%"
) else (
    set "BACKUP_FOLDER=BackUp_%BACKUP_NAME%_%TIMESTAMP%"
)

echo 🚀 기장선교지도 프로젝트 백업을 시작합니다...
echo 📁 백업 폴더: %BACKUP_FOLDER%

REM 백업 폴더 생성
if not exist "%BACKUP_FOLDER%" (
    mkdir "%BACKUP_FOLDER%"
    if errorlevel 1 (
        echo ❌ 백업 폴더 생성 실패
        pause
        exit /b 1
    )
    echo ✅ 백업 폴더 생성 완료
) else (
    echo ✅ 백업 폴더가 이미 존재합니다
)

REM 백업할 폴더 목록
set "FOLDERS=Admin PcWeb Mobile css js pdfs dailyreport prok"

REM 폴더 백업
echo 📂 폴더 백업 중...
for %%f in (%FOLDERS%) do (
    if exist "%%f" (
        xcopy "%%f" "%BACKUP_FOLDER%\%%f\" /E /I /Y >nul 2>&1
        if errorlevel 1 (
            echo   ❌ %%f - 복사 실패
        ) else (
            echo   ✅ %%f
        )
    ) else (
        echo   ⚠️  %%f (폴더 없음)
    )
)

REM 백업할 파일 확장자 목록
set "FILE_EXTENSIONS=*.html *.json *.md *.txt *.svg *.bat *.ps1 *.sh *.js *.css"

REM 파일 백업
echo 📄 파일 백업 중...
for %%e in (%FILE_EXTENSIONS%) do (
    for %%f in (%%e) do (
        if exist "%%f" (
            copy "%%f" "%BACKUP_FOLDER%\" >nul 2>&1
            if errorlevel 1 (
                echo   ❌ %%f - 복사 실패
            ) else (
                echo   ✅ %%f
            )
        )
    )
)

REM 백업 완료 통계
set "FILE_COUNT=0"
for /r "%BACKUP_FOLDER%" %%f in (*) do set /a FILE_COUNT+=1

echo.
echo 🎉 백업 완료!
echo 📊 백업 통계:
echo   📁 폴더: %BACKUP_FOLDER%
echo   📄 파일 수: %FILE_COUNT%개
echo   ⏰ 시간: %date% %time%

REM 백업 폴더 열기 옵션
set /p "OPEN_FOLDER=백업 폴더를 열까요? (y/n): "
if /i "%OPEN_FOLDER%"=="y" (
    explorer "%BACKUP_FOLDER%"
)

echo ✅ 백업이 성공적으로 완료되었습니다!
pause
exit /b 0

:help
echo 기장선교지도 프로젝트 백업 스크립트
echo.
echo 사용법:
echo   backup-all.bat                    # 자동으로 날짜시간으로 백업
echo   backup-all.bat "v1.0"             # 지정한 이름으로 백업
echo   backup-all.bat -h                 # 도움말 표시
echo.
echo 예시:
echo   backup-all.bat
echo   backup-all.bat "국가별리스트_완성"
echo   backup-all.bat "기도팝업_수정완료"
pause
exit /b 0 