#!/bin/bash

# 기장선교지도 프로젝트 전체 백업 스크립트
# Bash 버전 (Linux/Mac)

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 도움말 함수
show_help() {
    echo -e "${CYAN}기장선교지도 프로젝트 백업 스크립트${NC}"
    echo ""
    echo "사용법:"
    echo "  ./backup-all.sh                    # 자동으로 날짜시간으로 백업"
    echo "  ./backup-all.sh \"v1.0\"            # 지정한 이름으로 백업"
    echo "  ./backup-all.sh -h                 # 도움말 표시"
    echo ""
    echo "예시:"
    echo "  ./backup-all.sh"
    echo "  ./backup-all.sh \"국가별리스트_완성\""
    echo "  ./backup-all.sh \"기도팝업_수정완료\""
    exit 0
}

# 인수 처리
BACKUP_NAME=""
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
elif [ -n "$1" ]; then
    BACKUP_NAME="$1"
fi

# 현재 시간으로 백업 폴더명 생성
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
if [ -z "$BACKUP_NAME" ]; then
    BACKUP_FOLDER="BackUp_$TIMESTAMP"
else
    BACKUP_FOLDER="BackUp_${BACKUP_NAME}_$TIMESTAMP"
fi

echo -e "${GREEN}🚀 기장선교지도 프로젝트 백업을 시작합니다...${NC}"
echo -e "${YELLOW}📁 백업 폴더: $BACKUP_FOLDER${NC}"

# 백업 폴더 생성
if mkdir -p "$BACKUP_FOLDER"; then
    echo -e "${GREEN}✅ 백업 폴더 생성 완료${NC}"
else
    echo -e "${RED}❌ 백업 폴더 생성 실패${NC}"
    exit 1
fi

# 백업할 폴더 목록
FOLDERS=(
    "Admin"
    "PcWeb"
    "Mobile"
    "css"
    "js"
    "pdfs"
    "dailyreport"
    "prok"
)

# 백업할 파일 확장자 목록
FILE_EXTENSIONS=(
    "*.html"
    "*.json"
    "*.md"
    "*.txt"
    "*.svg"
    "*.bat"
    "*.ps1"
    "*.sh"
    "*.js"
    "*.css"
)

# 폴더 백업
echo -e "${CYAN}📂 폴더 백업 중...${NC}"
for folder in "${FOLDERS[@]}"; do
    if [ -d "$folder" ]; then
        if cp -r "$folder" "$BACKUP_FOLDER/" 2>/dev/null; then
            echo -e "  ${GREEN}✅ $folder${NC}"
        else
            echo -e "  ${RED}❌ $folder - 복사 실패${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠️  $folder (폴더 없음)${NC}"
    fi
done

# 파일 백업
echo -e "${CYAN}📄 파일 백업 중...${NC}"
for ext in "${FILE_EXTENSIONS[@]}"; do
    for file in $ext; do
        if [ -f "$file" ]; then
            if cp "$file" "$BACKUP_FOLDER/" 2>/dev/null; then
                echo -e "  ${GREEN}✅ $file${NC}"
            else
                echo -e "  ${RED}❌ $file - 복사 실패${NC}"
            fi
        fi
    done
done

# 백업 완료 통계
BACKUP_COUNT=$(find "$BACKUP_FOLDER" -type f | wc -l)
BACKUP_SIZE=$(du -sh "$BACKUP_FOLDER" | cut -f1)

echo ""
echo -e "${GREEN}🎉 백업 완료!${NC}"
echo -e "${YELLOW}📊 백업 통계:${NC}"
echo "  📁 폴더: $BACKUP_FOLDER"
echo "  📄 파일 수: $BACKUP_COUNT개"
echo "  💾 크기: $BACKUP_SIZE"
echo "  ⏰ 시간: $(date '+%Y-%m-%d %H:%M:%S')"

# 백업 폴더 열기 옵션 (Mac/Linux)
if command -v xdg-open >/dev/null 2>&1; then
    # Linux
    read -p "백업 폴더를 열까요? (y/n): " open_folder
    if [ "$open_folder" = "y" ] || [ "$open_folder" = "Y" ]; then
        xdg-open "$BACKUP_FOLDER"
    fi
elif command -v open >/dev/null 2>&1; then
    # Mac
    read -p "백업 폴더를 열까요? (y/n): " open_folder
    if [ "$open_folder" = "y" ] || [ "$open_folder" = "Y" ]; then
        open "$BACKUP_FOLDER"
    fi
fi

echo -e "${GREEN}✅ 백업이 성공적으로 완료되었습니다!${NC}" 