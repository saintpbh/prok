# GitHub 푸시 스크립트
# 사용법: .\push-to-github.ps1 [커밋메시지]

param(
    [string]$CommitMessage = "Update: 기장선교지도 프로젝트 업데이트"
)

# Git 경로 설정
$env:PATH += ";C:\Program Files\Git\bin"

Write-Host "=== GitHub 푸시 스크립트 시작 ===" -ForegroundColor Green

# 1. 현재 상태 확인
Write-Host "1. Git 상태 확인 중..." -ForegroundColor Yellow
git status

# 2. 변경사항 스테이징
Write-Host "`n2. 변경사항 스테이징 중..." -ForegroundColor Yellow
git add .

# 3. 커밋
Write-Host "`n3. 커밋 생성 중..." -ForegroundColor Yellow
Write-Host "커밋 메시지: $CommitMessage" -ForegroundColor Cyan
git commit -m $CommitMessage

# 4. 원격 저장소 확인
Write-Host "`n4. 원격 저장소 확인 중..." -ForegroundColor Yellow
$remotes = git remote -v
if ($remotes -match "origin") {
    Write-Host "원격 저장소가 이미 설정되어 있습니다." -ForegroundColor Green
} else {
    Write-Host "원격 저장소를 설정합니다..." -ForegroundColor Yellow
    git remote add origin https://github.com/saintpbh/prok.git
}

# 5. 브랜치를 main으로 설정
Write-Host "`n5. 브랜치를 main으로 설정 중..." -ForegroundColor Yellow
git branch -M main

# 6. 원격 저장소에서 최신 변경사항 가져오기
Write-Host "`n6. 원격 저장소에서 최신 변경사항 가져오는 중..." -ForegroundColor Yellow
try {
    git pull --rebase origin main
    Write-Host "원격 변경사항을 성공적으로 가져왔습니다." -ForegroundColor Green
} catch {
    Write-Host "원격 저장소가 비어있거나 충돌이 없습니다." -ForegroundColor Yellow
}

# 7. 푸시
Write-Host "`n7. GitHub로 푸시 중..." -ForegroundColor Yellow
try {
    git push -u origin main
    Write-Host "`n=== 푸시 성공! ===" -ForegroundColor Green
    Write-Host "GitHub 저장소: https://github.com/saintpbh/prok" -ForegroundColor Cyan
} catch {
    Write-Host "`n=== 푸시 실패 ===" -ForegroundColor Red
    Write-Host "오류: $_" -ForegroundColor Red
    Write-Host "`n수동으로 해결 방법:" -ForegroundColor Yellow
    Write-Host "1. git pull origin main" -ForegroundColor White
    Write-Host "2. 충돌 해결 후 git add ." -ForegroundColor White
    Write-Host "3. git commit -m 'Resolve conflicts'" -ForegroundColor White
    Write-Host "4. git push origin main" -ForegroundColor White
}

Write-Host "`n=== 스크립트 완료 ===" -ForegroundColor Green 