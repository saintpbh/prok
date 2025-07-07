/**
 * 국가별 선교사 리스트 관리 클래스
 * 독립적인 디자인과 기능을 제공
 */

class CountryMissionaryList {
    constructor() {
        this.currentContainer = null;
        this.currentCountry = null;
        this.missionaries = [];
        this.isVisible = false;
    }

    /**
     * 국가별 선교사 리스트 표시
     * @param {string} country - 국가명
     * @param {Array} missionaries - 선교사 배열
     */
    show(country, missionaries) {
        // 기존 리스트가 있으면 제거
        this.hide();
        
        // 기도 팝업 강제 일시정지 (다른 UI가 활성화됨)
        if (window.prayerPopupManager) {
            window.prayerPopupManager.forcePause();
        }
        
        this.currentCountry = country;
        this.missionaries = missionaries || [];
        this.isVisible = true;
        
        // 리스트 컨테이너 생성
        this.createContainer();
        
        // 리스트 내용 생성
        this.renderContent();
        
        // 이벤트 리스너 추가
        this.addEventListeners();
        
        console.log(`국가별 선교사 리스트 표시: ${country} (${this.missionaries.length}명)`);
    }

    /**
     * 리스트 숨기기
     */
    hide() {
        if (this.currentContainer) {
            // 닫기 애니메이션
            this.currentContainer.classList.add('closing');
            
            setTimeout(() => {
                if (this.currentContainer && this.currentContainer.parentNode) {
                    this.currentContainer.parentNode.removeChild(this.currentContainer);
                }
                this.currentContainer = null;
                this.isVisible = false;
                
                // 기도 팝업 강제 일시정지 해제 (다른 UI가 비활성화됨)
                if (window.prayerPopupManager) {
                    window.prayerPopupManager.forceResume();
                }
                
                console.log('국가별 선교사 리스트 숨김');
            }, 300);
        }
    }

    /**
     * 컨테이너 생성
     */
    createContainer() {
        this.currentContainer = document.createElement('div');
        this.currentContainer.className = 'cml-container';
        this.currentContainer.setAttribute('role', 'dialog');
        this.currentContainer.setAttribute('aria-labelledby', 'cml-title');
        this.currentContainer.setAttribute('aria-modal', 'true');
        
        document.body.appendChild(this.currentContainer);
    }

    /**
     * 리스트 내용 렌더링
     */
    renderContent() {
        const flagUrl = this.getFlagUrl(this.currentCountry);
        
        this.currentContainer.innerHTML = `
            <div class="cml-header">
                <h3 id="cml-title">
                    <img src="${flagUrl}" alt="${this.currentCountry} 국기" class="cml-flag">
                    ${this.currentCountry} 선교사
                </h3>
                <button class="cml-close-btn" aria-label="닫기" title="닫기">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="cml-content">
                ${this.renderStats()}
                ${this.renderList()}
            </div>
        `;
    }

    /**
     * 통계 정보 렌더링
     */
    renderStats() {
        return `
            <div class="cml-stats">
                <span>총 <strong class="cml-count">${this.missionaries.length}명</strong>의 선교사</span>
                <span>${this.currentCountry}</span>
            </div>
        `;
    }

    /**
     * 선교사 리스트 렌더링
     */
    renderList() {
        if (this.missionaries.length === 0) {
            return `
                <div class="cml-empty">
                    <i class="fas fa-users"></i>
                    <h4>선교사 정보가 없습니다</h4>
                    <p>${this.currentCountry}에는 현재 등록된 선교사가 없습니다.</p>
                </div>
            `;
        }

        const listItems = this.missionaries.map((missionary, index) => {
            const initials = this.getInitials(missionary.name);
            const city = missionary.city || '';
            
            return `
                <li class="cml-item" data-missionary-index="${index}">
                    <div class="cml-item-content" tabindex="0">
                        <div class="cml-avatar">
                            ${initials}
                        </div>
                        <div class="cml-info">
                            <div class="cml-name">${missionary.name}</div>
                            <div class="cml-location">
                                <i class="fas fa-map-marker-alt"></i>
                                ${city ? `${city}, ` : ''}${this.currentCountry}
                            </div>
                        </div>
                        <div class="cml-actions">
                            <button class="cml-action-btn cml-detail-btn" title="상세 정보 보기">
                                <i class="fas fa-info-circle"></i>
                                상세
                            </button>
                            <button class="cml-action-btn cml-prayer-btn" title="기도하기">
                                <i class="fas fa-pray"></i>
                                기도
                            </button>
                        </div>
                    </div>
                </li>
            `;
        }).join('');

        return `<ul class="cml-list">${listItems}</ul>`;
    }

    /**
     * 이벤트 리스너 추가
     */
    addEventListeners() {
        if (!this.currentContainer) return;

        // 닫기 버튼
        const closeBtn = this.currentContainer.querySelector('.cml-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // 배경 클릭 시 닫기
        this.currentContainer.addEventListener('click', (e) => {
            if (e.target === this.currentContainer) {
                this.hide();
            }
        });

        // 키보드 이벤트 (ESC 키)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // 선교사 아이템 클릭 이벤트
        const items = this.currentContainer.querySelectorAll('.cml-item');
        items.forEach((item, index) => {
            const missionary = this.missionaries[index];
            
            // 상세 정보 버튼
            const detailBtn = item.querySelector('.cml-detail-btn');
            if (detailBtn) {
                detailBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showMissionaryDetail(missionary);
                });
            }

            // 기도 버튼
            const prayerBtn = item.querySelector('.cml-prayer-btn');
            if (prayerBtn) {
                prayerBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handlePrayerClick(missionary);
                });
            }

            // 아이템 전체 클릭 (상세 정보 표시)
            const itemContent = item.querySelector('.cml-item-content');
            if (itemContent) {
                itemContent.addEventListener('click', () => {
                    this.showMissionaryDetail(missionary);
                });
                
                // 키보드 접근성
                itemContent.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.showMissionaryDetail(missionary);
                    }
                });
            }
        });
    }

    /**
     * 선교사 상세 정보 표시
     */
    showMissionaryDetail(missionary) {
        // missionary 객체가 올바른지 확인
        if (!missionary || !missionary.name) {
            console.error('유효하지 않은 선교사 데이터:', missionary);
            return;
        }
        
        // 기존 detailPopup.js의 함수 사용
        if (window.showMissionaryDetail) {
            window.showMissionaryDetail(missionary.name);
        } else if (window.fetchMissionaryDetails) {
            // 비동기로 상세 정보 가져오기
            window.fetchMissionaryDetails(missionary.name).then(details => {
                if (details) {
                    // 상세 정보 팝업 표시 로직
                    this.displayMissionaryDetail(details);
                }
            }).catch(error => {
                console.error('선교사 상세 정보 로드 실패:', error);
                alert('선교사 상세 정보를 불러올 수 없습니다.');
            });
        }
    }

    /**
     * 상세 정보 팝업 표시
     */
    displayMissionaryDetail(details) {
        // 기존 detailPopup 시스템과 연동
        if (window.detailPopup && window.detailPopup.show) {
            window.detailPopup.show(details);
        } else {
            // 기본 상세 정보 표시
            this.showBasicDetail(details);
        }
    }

    /**
     * 기본 상세 정보 표시
     */
    showBasicDetail(details) {
        const detailHtml = `
            <div style="padding: 20px; max-width: 500px;">
                <h3>${details.name || '이름 없음'}</h3>
                <p><strong>선교지:</strong> ${details.country || '정보 없음'}</p>
                <p><strong>도시:</strong> ${details.city || '정보 없음'}</p>
                <p><strong>파송년도:</strong> ${details.sent_date || '정보 없음'}</p>
                <p><strong>소속기관:</strong> ${details.organization || '정보 없음'}</p>
                <p><strong>노회:</strong> ${details.presbytery || '정보 없음'}</p>
                <p><strong>기도제목:</strong> ${details.prayer || '정보 없음'}</p>
                ${details.summary ? `<p><strong>요약:</strong> ${details.summary}</p>` : ''}
            </div>
        `;
        
        alert(detailHtml.replace(/<[^>]*>/g, '\n').trim());
    }

    /**
     * 기도 클릭 처리
     */
    handlePrayerClick(missionary) {
        // 기존 기도 시스템과 연동
        if (window.handlePrayerClick) {
            window.handlePrayerClick(missionary);
        } else if (window.prayerclick && window.prayerclick.handlePrayerClick) {
            window.prayerclick.handlePrayerClick(missionary);
        } else {
            // 기본 기도 처리
            this.showPrayerNotification(missionary.name);
        }
    }

    /**
     * 기도 알림 표시
     */
    showPrayerNotification(missionaryName) {
        const notification = document.getElementById('prayer-notification');
        if (notification) {
            const message = notification.querySelector('.prayer-message');
            if (message) {
                message.textContent = `${missionaryName} 선교사를 위해 기도하셨습니다.`;
                notification.classList.remove('hidden');
                
                setTimeout(() => {
                    notification.classList.add('hidden');
                }, 3000);
            }
        }
    }

    /**
     * 국기 URL 생성
     */
    getFlagUrl(country) {
        const flagCode = window.MissionaryMap?.constants?.COUNTRY_FLAGS?.[country];
        return flagCode ? `https://flagcdn.com/w40/${flagCode}.png` : '';
    }

    /**
     * 이름에서 이니셜 추출
     */
    getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
    }

    /**
     * 현재 상태 확인
     */
    getStatus() {
        return {
            isVisible: this.isVisible,
            currentCountry: this.currentCountry,
            missionaryCount: this.missionaries.length
        };
    }
}

// 전역 인스턴스 생성
window.countryMissionaryList = new CountryMissionaryList();

// 편의 함수들
window.showCountryMissionaryList = (country, missionaries) => {
    window.countryMissionaryList.show(country, missionaries);
};

window.hideCountryMissionaryList = () => {
    window.countryMissionaryList.hide();
};

console.log('CountryMissionaryList 모듈 로드 완료'); 