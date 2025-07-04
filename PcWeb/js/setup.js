// setup.js - 설정 및 뉴스레터 업로드 모달 관리 (Shoelace 기반)

document.addEventListener('DOMContentLoaded', function() {
    // UI 컨트롤 버튼 컨테이너를 항상 표시하도록 강제합니다.
    const uiControls = document.getElementById('ui-controls');
    if (uiControls) {
        uiControls.style.display = 'flex';
    }





    // --- 전체화면 기능 구현 ---
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const exitFullscreenBtn = document.getElementById('exitFullscreenBtn');
    
    // 전체화면 진입
    const enterFullscreen = () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
    };
    
    // 전체화면 종료
    const exitFullscreen = () => {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    };
    
    // 전체화면 상태 변경 감지
    const handleFullscreenChange = () => {
        const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
        
        if (isFullscreen) {
            fullscreenBtn.classList.add('hidden');
            exitFullscreenBtn.classList.remove('hidden');
        } else {
            fullscreenBtn.classList.remove('hidden');
            exitFullscreenBtn.classList.add('hidden');
        }
    };
    
    // 이벤트 리스너 설정
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', enterFullscreen);
    }
    
    if (exitFullscreenBtn) {
        exitFullscreenBtn.addEventListener('click', exitFullscreen);
    }
    
    // 전체화면 상태 변경 감지
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    // --- 이벤트 리스너 설정 (Shoelace 맞춤) ---

    // 뉴스 토글
    const newsToggle = document.getElementById('news-toggle');
    newsToggle.checked = localStorage.getItem('news-toggle') === 'on';
    newsToggle.addEventListener('sl-change', () => {
        localStorage.setItem('news-toggle', newsToggle.checked ? 'on' : 'off');
        window.fetchNewsFromSheet?.();
    });

    // 뉴스 체크 주기 설정
    const newsIntervalInput = document.getElementById('news-interval-input');
    if (newsIntervalInput) {
        newsIntervalInput.addEventListener('sl-change', (e) => {
            const interval = e.target.value;
            if (window.setNewsCheckInterval) {
                window.setNewsCheckInterval(interval);
            }
        });
    }

    // 테이블 토글 (완전히 안전한 방식)
    const initTableToggles = () => {
        console.log('setup.js: 테이블 토글 초기화 시작');
        
        // 테이블 ID 매핑
        const tableMapping = [
            { toggleId: 'country-table-toggle', tableId: 'missionary-table-country' },
            { toggleId: 'presbytery-table-toggle', tableId: 'missionary-table-presbytery' }
        ];
        
        // 완전히 안전한 테이블 표시/숨김 함수
        const setTableVisibility = (tableId, visible) => {
            try {
                const element = document.getElementById(tableId);
                if (!element) {
                    console.warn(`setup.js: 테이블 요소 없음: ${tableId}`);
                    return false;
                }
                
                // style 객체가 존재하는지 확인
                if (!element.style) {
                    console.warn(`setup.js: 테이블 요소에 style 속성 없음: ${tableId}`);
                    return false;
                }
                
                // display 속성을 안전하게 설정
                element.style.setProperty('display', visible ? '' : 'none');
                console.log(`setup.js: 테이블 ${tableId} -> ${visible ? '표시' : '숨김'}`);
                return true;
                
            } catch (error) {
                console.error(`setup.js: 테이블 ${tableId} 표시 설정 실패:`, error);
                return false;
            }
        };
        
        // 각 토글 설정
        tableMapping.forEach(({ toggleId, tableId }) => {
            try {
                const toggle = document.getElementById(toggleId);
                if (!toggle) {
                    console.warn(`setup.js: 토글 요소 없음: ${toggleId}`);
                    return;
                }
                
                // 초기 상태 설정
                const savedState = localStorage.getItem(toggleId);
                const isVisible = savedState !== 'off';
                toggle.checked = isVisible;
                
                // 이벤트 리스너
                toggle.addEventListener('sl-change', (event) => {
                    const newState = event.target.checked;
                    localStorage.setItem(toggleId, newState ? 'on' : 'off');
                    setTableVisibility(tableId, newState);
                });
                
                // 초기 표시 설정
                setTimeout(() => {
                    setTableVisibility(tableId, isVisible);
                }, 100);
                
            } catch (error) {
                console.error(`setup.js: 토글 ${toggleId} 설정 실패:`, error);
            }
        });
        
        console.log('setup.js: 테이블 토글 초기화 완료');
    };
    
    // DOM 준비 확인 및 초기화
    let waitCount = 0;
    const waitForTablesAndInit = () => {
        const requiredTables = ['missionary-table-country', 'missionary-table-presbytery'];
        const allExist = requiredTables.every(id => {
            const element = document.getElementById(id);
            return element && element.style;
        });
        
        if (allExist) {
            initTableToggles();
        } else {
            waitCount++;
            if (waitCount <= 5) {
                console.log('setup.js: 테이블 요소 대기 중... (' + waitCount + '회)');
                setTimeout(waitForTablesAndInit, 500);
            } else {
                console.warn('setup.js: 테이블 요소를 5회 시도했으나 찾지 못해 중단합니다.');
            }
        }
    };
    
    // 1초 후 초기화 시작
    setTimeout(waitForTablesAndInit, 1000);
    
    // 중보기도자 수 기능 초기화
    const initPrayerCount = () => {
        if (window.MissionaryMap && window.MissionaryMap.initPrayerCount) {
            window.MissionaryMap.initPrayerCount();
        } else {
            // MissionaryMap이 아직 로드되지 않았으면 재시도
            setTimeout(initPrayerCount, 500);
        }
    };
    
    // 2초 후 중보기도자 수 기능 초기화
    setTimeout(initPrayerCount, 2000);
    
    // 자동재생 모드 설정
    const autoplayGroup = document.getElementById('autoplay-mode-group');
    autoplayGroup.value = localStorage.getItem('autoplay-mode') || 'fixed'; // UI에 저장된 값 반영
    autoplayGroup.addEventListener('sl-change', () => {
        const newMode = autoplayGroup.value;
        localStorage.setItem('autoplay-mode', newMode);
        // MissionaryMap에 변경사항 전파
        if (window.MissionaryMap && typeof window.MissionaryMap.setAutoplayMode === 'function') {
            window.MissionaryMap.setAutoplayMode(newMode);
        }
    });
    
    // 각종 설정값 적용 (Input)
    const setupInput = (id, storageKey, callback) => {
        const input = document.getElementById(id);
        if(!input) return;
        input.value = localStorage.getItem(storageKey) || input.value;
        input.addEventListener('sl-change', () => {
            localStorage.setItem(storageKey, input.value);
            callback?.(input.value);
        });
    };
    
    setupInput('news-interval-input', 'news-check-interval');
    setupInput('news-speed-input', 'news-speed', (value) => {
        if (window.setNewsSpeed) {
            window.setNewsSpeed(value);
        }
    });
    setupInput('news-fontsize-input', 'news-fontsize', (value) => {
        const newsBar = document.getElementById('news-bar');
        if (newsBar) {
            newsBar.style.fontSize = `${value}px`;
        }
    });
    setupInput('news-width-input', 'news-width', (value) => {
        const newsBar = document.getElementById('news-bar');
        if (newsBar) {
            newsBar.style.width = `${value}%`;
        }
    });
    setupInput('news-height-input', 'news-height', (value) => {
        const newsBar = document.getElementById('news-bar');
        if (newsBar) {
            newsBar.style.height = `${value}px`;
        }
    });

    // 색상 설정 실시간 적용
    const newsTextColor = document.getElementById('news-text-color');
    if (newsTextColor) {
        newsTextColor.value = localStorage.getItem('news-text-color') || '#ffffff';
        newsTextColor.addEventListener('sl-change', (e) => {
            const color = e.target.value;
            localStorage.setItem('news-text-color', color);
            const newsBar = document.getElementById('news-bar');
            if (newsBar) {
                newsBar.style.setProperty('--news-bar-text', color);
            }
        });
    }
    
    const newsBgColor = document.getElementById('news-bg-color');
    if (newsBgColor) {
        newsBgColor.value = localStorage.getItem('news-bg-color') || '#1a73ff';
        newsBgColor.addEventListener('sl-change', (e) => {
            const color = e.target.value;
            localStorage.setItem('news-bg-color', color);
            const newsBar = document.getElementById('news-bar');
            if (newsBar) {
                newsBar.style.setProperty('--news-bar-bg', color);
            }
        });
    }
    
    // 뉴스레터 업로드 기능
    const newsletterUploadBtn = document.getElementById('newsletter-upload-btn');
    const newsletterLinkBtn = document.getElementById('newsletter-link-btn');
    const missionaryNameInput = document.getElementById('missionary-name-input');
    const missionaryPrayerInput = document.getElementById('missionary-prayer-input');
    const missionaryDateInput = document.getElementById('missionary-date-input');
    
    if (newsletterUploadBtn) {
        newsletterUploadBtn.addEventListener('click', async () => {
            const fileInput = document.getElementById('newsletter-pdf');
            const name = missionaryNameInput?.value?.trim();
            const prayer = missionaryPrayerInput?.value?.trim();
            const date = missionaryDateInput?.value;
            
            if (!name) {
                alert('선교사 이름을 입력해주세요.');
                return;
            }
            
            if (!fileInput.files[0]) {
                alert('PDF 파일을 선택해주세요.');
                return;
            }
            
            const file = fileInput.files[0];
            if (file.type !== 'application/pdf') {
                alert('PDF 파일만 업로드 가능합니다.');
                return;
            }
            
            try {
                // 로딩 상태 표시
                newsletterUploadBtn.disabled = true;
                newsletterUploadBtn.textContent = '업로드 중...';
                
                // Firebase Storage에 업로드 (간단한 구현)
                const storageRef = window.firebase?.storage?.ref();
                if (!storageRef) {
                    throw new Error('Firebase Storage가 초기화되지 않았습니다.');
                }
                
                const fileName = `newsletters/${name}_${Date.now()}.pdf`;
                const fileRef = storageRef.child(fileName);
                const snapshot = await fileRef.put(file);
                const downloadURL = await snapshot.ref.getDownloadURL();
                
                // Firebase Database에 정보 저장
                const db = window.firebase?.database();
                if (db) {
                    await db.ref('newsletters').push({
                        name: name,
                        prayer: prayer || '현지 정착과 건강을 위해',
                        date: date || new Date().toISOString().split('T')[0],
                        url: downloadURL,
                        uploadedAt: new Date().toISOString()
                    });
                }
                
                alert('뉴스레터가 성공적으로 업로드되었습니다.');
                
                // 입력 필드 초기화
                if (fileInput) fileInput.value = '';
                if (missionaryNameInput) missionaryNameInput.value = '';
                if (missionaryPrayerInput) missionaryPrayerInput.value = '';
                if (missionaryDateInput) missionaryDateInput.value = '';
                
            } catch (error) {
                console.error('뉴스레터 업로드 실패:', error);
                alert('업로드에 실패했습니다: ' + error.message);
            } finally {
                newsletterUploadBtn.disabled = false;
                newsletterUploadBtn.textContent = '업로드';
            }
        });
    }
    
    if (newsletterLinkBtn) {
        newsletterLinkBtn.addEventListener('click', async () => {
            const name = missionaryNameInput?.value?.trim();
            const prayer = missionaryPrayerInput?.value?.trim();
            const date = missionaryDateInput?.value;
            
            if (!name) {
                alert('선교사 이름을 입력해주세요.');
                return;
            }
            
            const link = prompt('뉴스레터 외부 링크를 입력해주세요:');
            if (!link) return;
            
            try {
                // Firebase Database에 링크 정보 저장
                const db = window.firebase?.database();
                if (db) {
                    await db.ref('newsletters').push({
                        name: name,
                        prayer: prayer || '현지 정착과 건강을 위해',
                        date: date || new Date().toISOString().split('T')[0],
                        url: link,
                        uploadedAt: new Date().toISOString(),
                        isExternalLink: true
                    });
                }
                
                alert('뉴스레터 링크가 성공적으로 저장되었습니다.');
                
                // 입력 필드 초기화
                if (missionaryNameInput) missionaryNameInput.value = '';
                if (missionaryPrayerInput) missionaryPrayerInput.value = '';
                if (missionaryDateInput) missionaryDateInput.value = '';
                
            } catch (error) {
                console.error('뉴스레터 링크 저장 실패:', error);
                alert('저장에 실패했습니다: ' + error.message);
            }
        });
    }
}); 