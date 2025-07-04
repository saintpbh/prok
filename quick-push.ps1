# 간단한 GitHub 푸시 스크립트
# 사용법: .\quick-push.ps1

# Git 경로 설정
$env:PATH += ";C:\Program Files\Git\bin"

Write-Host "GitHub 푸시 시작..." -ForegroundColor Green

# 모든 변경사항 추가 및 커밋
git add .
git commit -m "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# 원격 저장소 설정 (이미 있으면 무시됨)
git remote add origin https://github.com/saintpbh/prok.git 2>$null

# 브랜치를 main으로 설정
git branch -M main

# 원격 변경사항 가져오기 (충돌 방지)
git pull --rebase origin main 2>$null

# 푸시
git push -u origin main

Write-Host "푸시 완료!" -ForegroundColor Green 