#!/bin/bash

# --- 백업 설정 ---
# 백업할 프로젝트의 루트 디렉토리 (현재 스크립트가 실행되는 디렉토리)
SOURCE_DIR="$(pwd)"
# 백업 파일을 저장할 디렉토리 (예: 프로젝트 루트의 'backups' 폴더)
BACKUP_DIR="${SOURCE_DIR}/project_backups"
# 보존할 백업 파일의 개수 (예: 최근 7개)
RETENTION_DAYS=7

# Firebase 프로젝트 ID (여기에 실제 프로젝트 ID를 입력하세요!)
FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID" # <--- 이 부분을 수정하세요!

# 백업에서 제외할 패턴 (공백으로 구분)
# node_modules, .git, 로그 파일, 다른 백업 디렉토리 등을 제외합니다.
EXCLUDE_PATTERNS=(
    "node_modules"
    ".git"
    "*.log"
    "package-lock.json"
    "pglite-debug.log"
    "dailyreport"
    "BackUp20250627"
    "prok/BackUp20250627"
    "Missionmap-mirror"
    "Missionmap-mirror.bfg-report"
    ".firebase"
    "Admin/node_modules"
    "Admin/functions/node_modules"
    "Admin/package-lock.json"
    "Admin/pglite-debug.log"
    "PcWeb/pglite-debug.log"
)

# --- 스크립트 시작 ---
echo "--- 프로젝트 백업 시작: $(date) ---"

# 백업 디렉토리 생성 (없으면)
mkdir -p "${BACKUP_DIR}"

# 백업 파일 이름 생성 (년월일시분초)
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="project_backup_${TIMESTAMP}.tar.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

# 제외 패턴을 tar 명령어를 위한 형식으로 변환
TAR_EXCLUDES=""
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    TAR_EXCLUDES+=" --exclude='${pattern}'"
done

# 프로젝트 소스 코드 백업 실행
echo "프로젝트 소스 코드 백업 중... ${SOURCE_DIR} -> ${BACKUP_PATH}"
eval "tar ${TAR_EXCLUDES} -czf "${BACKUP_PATH}" -C "${SOURCE_DIR}" ."

# 소스 코드 백업 성공 여부 확인
if [ $? -eq 0 ]; then
    echo "프로젝트 소스 코드 백업 성공: ${BACKUP_FILENAME}"
else
    echo "프로젝트 소스 코드 백업 실패!"
    exit 1 # 실패 시 스크립트 종료
fi

# --- Firebase Firestore 데이터 백업 ---
if [ "${FIREBASE_PROJECT_ID}" != "YOUR_FIREBASE_PROJECT_ID" ]; then
    FIREBASE_BACKUP_SUBDIR="${BACKUP_DIR}/firestore_backup_${TIMESTAMP}"
    echo "Firebase Firestore 데이터 백업 중... 프로젝트: ${FIREBASE_PROJECT_ID}"
    echo "백업 경로: ${FIREBASE_BACKUP_SUBDIR}"
    mkdir -p "${FIREBASE_BACKUP_SUBDIR}"

    # Firestore 데이터 내보내기
    # 모든 컬렉션을 백업하려면 --all-collections 플래그를 사용합니다.
    # 특정 컬렉션만 백업하려면 --collections collection1,collection2 와 같이 지정합니다.
    firebase firestore:export "${FIREBASE_BACKUP_SUBDIR}" --project "${FIREBASE_PROJECT_ID}" --all-collections

    if [ $? -eq 0 ]; then
        echo "Firebase Firestore 데이터 백업 성공."
    else
        echo "Firebase Firestore 데이터 백업 실패! Firebase CLI가 설치되어 있고 로그인 및 프로젝트가 선택되었는지 확인하세요."
    fi
else
    echo "경고: FIREBASE_PROJECT_ID가 설정되지 않아 Firebase Firestore 데이터 백업을 건너뜁니다."
fi

# --- Firebase Storage 데이터 백업 (참고) ---
echo ""
echo "참고: Firebase Storage의 모든 파일을 백업하려면 Google Cloud SDK의 'gsutil' 도구를 사용하는 것이 더 효율적입니다."
echo "예시: gsutil -m cp -r gs://<your-storage-bucket-name> ${BACKUP_DIR}/storage_backup_${TIMESTAMP}"
echo "자세한 내용은 Google Cloud Storage 문서를 참조하세요."
echo ""

# --- 오래된 백업 파일 정리 ---
echo "오래된 백업 파일 정리 중 (최근 ${RETENTION_DAYS}일 유지)..."
# find 명령어를 사용하여 오래된 파일 찾아서 삭제
# -mtime +N : N일보다 오래된 파일
# -delete   : 찾은 파일 삭제
find "${BACKUP_DIR}" -type f -name "project_backup_*.tar.gz" -mtime +"${RETENTION_DAYS}" -delete
# Firestore 백업 디렉토리도 함께 정리 (이름 패턴에 따라)
find "${BACKUP_DIR}" -type d -name "firestore_backup_*" -mtime +"${RETENTION_DAYS}" -exec rm -rf {} +

echo "--- 백업 완료: $(date) ---"