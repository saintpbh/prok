// MobileNewsSwip.js - 선교편지 인스타 스타일 카드 스와이프 (Firestore 연동)

document.addEventListener('DOMContentLoaded', function() {
  let newsList = [];
  let swiperInstance = null;
  let photoSwipers = []; // 사진 스와이퍼 인스턴스들을 저장할 배열
  let isLoading = false; // 로딩 상태 추적
  let allMissionaries = []; // 모든 선교사 데이터 (Firestore에서)
  let isInitialLoadComplete = false; // 초기 로딩 완료 여부
  let currentBatchSize = 5; // 현재 배치 크기
  let loadedCount = 0; // 로드된 총 개수
  let totalCount = 0; // 전체 개수
  let isLoadingMore = false; // 추가 로딩 중인지
  let loadProgress = 0; // 로딩 진행률 (0-100)

  // 로고 이미지 (파란 바탕에 로고)
  const LOGO_IMAGE = 'logo-main.svg';

  // 더미 이미지 배열 (최적화된 이미지)
  const DUMMY_IMAGES = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=400&q=60'
  ];

  // 로딩 상태 업데이트
  function updateLoadingStatus(message, progress = null) {
    const loadingElement = document.getElementById('loadingStatus');
    const progressElement = document.getElementById('loadingProgress');
    
    if (loadingElement) {
      loadingElement.textContent = message;
    }
    
    if (progressElement && progress !== null) {
      progressElement.textContent = `${progress}% 완료`;
    }
  }

  // 로딩 진행률 표시 함수
  function updateLoadProgress(current, total) {
    loadProgress = total > 0 ? Math.round((current / total) * 100) : 0;
    const progressText = total > 0 ? `${current}/${total} 선교사` : `${current} 선교사`;
    updateLoadingStatus(`데이터를 불러오는 중... ${progressText}`, loadProgress);
  }

  // Firebase 초기화 확인
  function initializeFirebase() {
    if (!window.firebase) {
      console.error('Firebase가 로드되지 않았습니다.');
      return false;
    }
    return true;
  }

  // 스마트 배치 로딩 - 초기 5개만 로드
  async function loadInitialMissionariesFromFirestore() {
    if (isLoading) return;
    isLoading = true;
    
    if (!initializeFirebase()) {
      console.log('Firebase 초기화 실패, 더미 데이터 사용');
      updateLoadingStatus('더미 데이터를 준비하는 중...');
      setTimeout(() => {
        loadDummyData();
        isLoading = false;
      }, 500);
      return;
    }

    try {
      updateLoadingStatus('Firebase에 연결하는 중...');
      
      const rtdb = window.firebase.database();
      
      console.log('스마트 배치 로딩 시작 - 초기 5개');
      updateLoadingStatus('최근 선교사 정보를 불러오는 중...');
      
      // 전체 데이터 개수 먼저 확인
      const snapshot = await rtdb.ref('missionaries').once('value');
      const data = snapshot.val();
      
      if (data) {
        const missionaryArray = Object.keys(data).map(key => ({
          id: key,
          _id: key,
          ...data[key]
        }));
        
        const validMissionaries = missionaryArray
          .filter(missionary => missionary.name && missionary.name.trim() !== '')
          .sort((a, b) => {
            const dateA = a.createdAt || a.sentDate || a.sent_date || 0;
            const dateB = b.createdAt || b.sentDate || b.sent_date || 0;
            return dateB - dateA;
          });
        
        totalCount = validMissionaries.length;
        console.log(`전체 ${totalCount}명의 선교사 데이터 확인됨`);
        
        // 초기 5개만 처리
        const initialMissionaries = validMissionaries.slice(0, currentBatchSize);
        const missionaries = [];
        
        for (const missionary of initialMissionaries) {
          const processedMissionary = {
            id: missionary.id,
            name: missionary.name || '이름 없음',
            country: missionary.country || '국가 정보 없음',
            mission: missionary.organization || missionary.city || '사역 정보 없음',
            content: missionary.summary || missionary.prayer || missionary.prayerTitle || '내용이 없습니다.',
            date: formatDate(missionary.createdAt || missionary.sentDate || missionary.sent_date || new Date()),
            newsletterUrl: null,
            originalDate: missionary.createdAt || missionary.sentDate || missionary.sent_date || new Date()
          };
          
          missionaries.push(processedMissionary);
        }
        
        newsList = missionaries;
        loadedCount = missionaries.length;
        
        console.log(`초기 배치 로드 완료: ${loadedCount}/${totalCount} 명`);
        updateLoadProgress(loadedCount, totalCount);
        
        if (newsList.length === 0) {
          console.log('데이터가 없어 더미 데이터를 사용합니다.');
          updateLoadingStatus('더미 데이터를 준비하는 중...');
          setTimeout(() => {
            loadDummyData();
            isLoading = false;
          }, 500);
        } else {
          updateLoadingStatus('화면을 구성하는 중...');
          setTimeout(() => {
            renderNewsCards();
            isLoading = false;
            isInitialLoadComplete = true;
            
            // 초기 로딩 완료 후 다음 배치 준비
            if (loadedCount < totalCount) {
              setTimeout(() => {
                prepareNextBatch();
              }, 1000);
            }
          }, 300);
        }
      } else {
        console.log('데이터가 없어 더미 데이터를 사용합니다.');
        updateLoadingStatus('더미 데이터를 준비하는 중...');
        setTimeout(() => {
          loadDummyData();
          isLoading = false;
        }, 500);
      }
      
    } catch (error) {
      console.error('초기 배치 로드 실패:', error);
      console.log('더미 데이터를 사용합니다.');
      updateLoadingStatus('더미 데이터를 준비하는 중...');
      setTimeout(() => {
        loadDummyData();
        isLoading = false;
      }, 500);
    }
  }

  // 다음 배치 준비 (백그라운드에서)
  async function prepareNextBatch() {
    if (isLoadingMore || loadedCount >= totalCount) return;
    
    isLoadingMore = true;
    console.log(`다음 배치 준비 중... (현재: ${loadedCount}/${totalCount})`);
    
    try {
      const rtdb = window.firebase.database();
      const snapshot = await rtdb.ref('missionaries').once('value');
      const data = snapshot.val();
      
      if (data) {
        const missionaryArray = Object.keys(data).map(key => ({
          id: key,
          _id: key,
          ...data[key]
        }));
        
        const validMissionaries = missionaryArray
          .filter(missionary => missionary.name && missionary.name.trim() !== '')
          .sort((a, b) => {
            const dateA = a.createdAt || a.sentDate || a.sent_date || 0;
            const dateB = b.createdAt || b.sentDate || b.sent_date || 0;
            return dateB - dateA;
          });
        
        // 다음 배치 크기 계산 (스마트 배치)
        const nextBatchSize = Math.min(5, totalCount - loadedCount);
        const nextBatch = validMissionaries.slice(loadedCount, loadedCount + nextBatchSize);
        
        const newMissionaries = [];
        for (const missionary of nextBatch) {
          const processedMissionary = {
            id: missionary.id,
            name: missionary.name || '이름 없음',
            country: missionary.country || '국가 정보 없음',
            mission: missionary.organization || missionary.city || '사역 정보 없음',
            content: missionary.summary || missionary.prayer || missionary.prayerTitle || '내용이 없습니다.',
            date: formatDate(missionary.createdAt || missionary.sentDate || missionary.sent_date || new Date()),
            newsletterUrl: null,
            originalDate: missionary.createdAt || missionary.sentDate || missionary.sent_date || new Date()
          };
          
          newMissionaries.push(processedMissionary);
        }
        
        // 데이터 병합
        newsList = newsList.concat(newMissionaries);
        loadedCount += newMissionaries.length;
        
        console.log(`배치 로드 완료: ${loadedCount}/${totalCount} 명 (${newMissionaries.length}개 추가)`);
        
        // Swiper에 새 슬라이드 추가 (부드러운 애니메이션)
        if (newMissionaries.length > 0) {
          addSlidesToSwiper(newMissionaries);
        }
        
        // 다음 배치 준비
        if (loadedCount < totalCount) {
          setTimeout(() => {
            prepareNextBatch();
          }, 2000); // 2초 후 다음 배치
        } else {
          console.log('모든 선교사 데이터 로드 완료!');
          updateLoadingStatus('모든 데이터 로드 완료');
        }
      }
      
    } catch (error) {
      console.error('배치 로드 실패:', error);
    } finally {
      isLoadingMore = false;
    }
  }

  // 뉴스 카드 DOM 요소 생성
  function createNewsCard(missionary) {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    slide.innerHTML = createCard(missionary, newsList.length);
    return slide;
  }

  // Swiper에 새 슬라이드 추가 (부드러운 애니메이션)
  function addSlidesToSwiper(newMissionaries) {
    if (!swiperInstance) return;
    
    const swiperWrapper = swiperInstance.wrapperEl;
    
    newMissionaries.forEach((missionary, index) => {
      const slide = createNewsCard(missionary);
      slide.style.opacity = '0';
      slide.style.transform = 'translateX(20px)';
      slide.style.transition = 'all 0.5s ease';
      
      swiperWrapper.appendChild(slide);
      
      // 순차적으로 페이드인 애니메이션
      setTimeout(() => {
        slide.style.opacity = '1';
        slide.style.transform = 'translateX(0)';
      }, index * 100); // 각 카드마다 100ms 지연
    });
    
    // Swiper 업데이트
    swiperInstance.update();
  }

  // 더미 데이터 로드 (Firebase 실패 시)
  function loadDummyData() {
    allMissionaries = [
      {
        id: 'dummy1',
        name: '홍길동',
        country: '대한민국',
        mission: '청년사역',
        content: '주님의 은혜로 청년들과 함께 성장하고 있습니다. 많은 기도 부탁드립니다.',
        date: '2024.07.01',
        newsletterUrl: null,
        originalDate: new Date('2024-07-01')
      },
      {
        id: 'dummy2',
        name: '김선교',
        country: '일본',
        mission: '교회개척',
        content: '일본에서 새로운 교회가 세워지고 있습니다. 하나님의 인도하심에 감사드립니다.',
        date: '2024.06.28',
        newsletterUrl: null,
        originalDate: new Date('2024-06-28')
      },
      {
        id: 'dummy3',
        name: '이사랑',
        country: '몽골',
        mission: '어린이사역',
        content: '몽골의 아이들과 함께 복음을 나누고 있습니다. 계속적인 관심과 기도 부탁드립니다.',
        date: '2024.06.25',
        newsletterUrl: null,
        originalDate: new Date('2024-06-25')
      },
      {
        id: 'dummy4',
        name: '박단일',
        country: '태국',
        mission: '의료선교',
        content: '태국에서 의료봉사를 통해 하나님의 사랑을 전하고 있습니다. 사진이 1장뿐인 경우 테스트입니다.',
        date: '2024.06.20',
        newsletterUrl: null,
        originalDate: new Date('2024-06-20')
      },
      {
        id: 'dummy5',
        name: '최복음',
        country: '베트남',
        mission: '교육선교',
        content: '베트남에서 교육을 통해 복음을 전하고 있습니다. 학생들의 변화를 보며 감사합니다.',
        date: '2024.06.15',
        newsletterUrl: null,
        originalDate: new Date('2024-06-15')
      },
      {
        id: 'dummy6',
        name: '정사랑',
        country: '캄보디아',
        mission: '농촌개발',
        content: '캄보디아 농촌에서 개발사업을 통해 하나님의 사랑을 실천하고 있습니다.',
        date: '2024.06.10',
        newsletterUrl: null,
        originalDate: new Date('2024-06-10')
      },
      {
        id: 'dummy7',
        name: '한희망',
        country: '라오스',
        mission: '어린이보호',
        content: '라오스의 어려운 아이들을 보호하고 교육하는 사역을 하고 있습니다.',
        date: '2024.06.05',
        newsletterUrl: null,
        originalDate: new Date('2024-06-05')
      },
      {
        id: 'dummy8',
        name: '윤평화',
        country: '미얀마',
        mission: '평화운동',
        content: '미얀마에서 평화운동을 통해 하나님의 평화를 전하고 있습니다.',
        date: '2024.06.01',
        newsletterUrl: null,
        originalDate: new Date('2024-06.01')
      },
      {
        id: 'dummy9',
        name: '김복음',
        country: '네팔',
        mission: '산악지역선교',
        content: '네팔 산악지역에서 복음을 전하고 있습니다. 현지인들의 따뜻한 환대에 감사합니다.',
        date: '2024.05.28',
        newsletterUrl: null,
        originalDate: new Date('2024-05-28')
      },
      {
        id: 'dummy10',
        name: '박희망',
        country: '방글라데시',
        mission: '어린이교육',
        content: '방글라데시에서 어린이들을 교육하며 하나님의 사랑을 나누고 있습니다.',
        date: '2024.05.25',
        newsletterUrl: null,
        originalDate: new Date('2024-05-25')
      },
      {
        id: 'dummy11',
        name: '이평화',
        country: '스리랑카',
        mission: '재난구호',
        content: '스리랑카에서 재난 구호 활동을 통해 하나님의 사랑을 실천하고 있습니다.',
        date: '2024.05.20',
        newsletterUrl: null,
        originalDate: new Date('2024-05-20')
      },
      {
        id: 'dummy12',
        name: '최사랑',
        country: '인도',
        mission: '의료봉사',
        content: '인도에서 의료봉사를 통해 하나님의 치유의 손길을 전하고 있습니다.',
        date: '2024.05.15',
        newsletterUrl: null,
        originalDate: new Date('2024-05-15')
      }
    ];
    
    // 초기 5개만 로드
    newsList = allMissionaries.slice(0, 5);
    renderNewsCards();
    isInitialLoadComplete = true;
    
    // 화면 표시 후 나머지 데이터 로드
    setTimeout(() => {
      const remainingMissionaries = allMissionaries.slice(5);
      if (remainingMissionaries.length > 0) {
        newsList = newsList.concat(remainingMissionaries);
        updateSwiperWithNewSlides(remainingMissionaries);
      }
    }, 1000);
  }

  // 날짜 포맷팅 함수
  function formatDate(dateString) {
    if (!dateString) return '날짜 정보 없음';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '날짜 정보 없음';
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}.${month}.${day}`;
    } catch (error) {
      return '날짜 정보 없음';
    }
  }

  // 카드 HTML 생성 (이미지 슬라이드 기능 추가)
  function createCard(news, idx) {
    // 파송년도 추출
    const sentYear = extractSentYear(news.originalDate);
    
    // 최근 소식 날짜 (현재 표시되는 날짜)
    const recentDate = news.date;
    
    return `
      <div class="news-card">
        <div class="news-photo-swiper swiper news-photo-swiper-${idx}">
          <div class="swiper-wrapper">
            <!-- 그라데이션 이미지 1 -->
            <div class="swiper-slide">
              <div class="gradient-image-1">
                <span>선교사 ${news.name}</span>
              </div>
            </div>
            <!-- 그라데이션 이미지 2 -->
            <div class="swiper-slide">
              <div class="gradient-image-2">
                <span>${news.country}</span>
              </div>
            </div>
            <!-- 그라데이션 이미지 3 -->
            <div class="swiper-slide">
              <div class="gradient-image-3">
                <span>${news.mission}</span>
              </div>
            </div>
          </div>
          <!-- 네비게이션 버튼 -->
          <div class="swiper-button-next"></div>
          <div class="swiper-button-prev"></div>
          <!-- 페이징 -->
          <div class="swiper-pagination"></div>
        </div>
        
        <!-- 이름과 파송년도 (왼쪽 정렬) -->
        <div class="news-card-name-year">
          <span class="news-card-title">${news.name}</span>
          <span class="news-card-sent-year">(${sentYear})</span>
        </div>
        
        <!-- 국가와 사역내용 (왼쪽 정렬) -->
        <div class="news-card-location">📍 ${news.country} | ${news.mission}</div>
        
        <!-- 기도제목 (왼쪽 정렬) -->
        <div class="news-card-content">${news.content}</div>
        
        <!-- 뉴스레터 원본보기 버튼 (가운데 정렬) -->
        <div class="news-card-button-container">
          <button class="news-card-original-btn" data-news-id="${news.id}">뉴스레터 원본보기</button>
        </div>
        
        <!-- 최근 뉴스레터 날짜 (오른쪽 정렬) -->
        <div class="news-card-date">${recentDate}</div>
      </div>
    `;
  }

  // 파송년도 추출 함수
  function extractSentYear(dateString) {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const year = date.getFullYear();
      return `${year}년 파송`;
    } catch (error) {
      return '';
    }
  }

  // 이미지 지연 로딩 (로고는 이미 로컬이므로 간단하게)
  function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  // 상단 점 3개 관리
  function showTopDots() {
    const dots = document.getElementById('top-dots');
    if (dots) {
      dots.style.display = 'block';
      // 5초 후 자동으로 숨기기
      setTimeout(() => {
        hideTopDots();
      }, 5000);
    }
  }
  
  function hideTopDots() {
    const dots = document.getElementById('top-dots');
    if (dots) {
      dots.style.display = 'none';
    }
  }

  // 뉴스 카드 렌더링
  function renderNewsCards() {
    const wrapper = document.getElementById('news-swiper-wrapper');
    if (!wrapper) {
      console.error('news-swiper-wrapper를 찾을 수 없습니다.');
      return;
    }
    
    // 기존 사진 스와이퍼 인스턴스들 정리
    photoSwipers.forEach(swiper => {
      if (swiper && typeof swiper.destroy === 'function') {
        swiper.destroy(true, true);
      }
    });
    photoSwipers = [];
    
    wrapper.innerHTML = newsList.map((news, i) => `<div class="swiper-slide">${createCard(news, i)}</div>`).join('');
    
    // 로딩 상태 숨기고 스와이퍼 보이기
    const loadingContainer = document.getElementById('loading-container');
    const swiperContainer = document.getElementById('swiper-container');
    
    if (loadingContainer) loadingContainer.style.display = 'none';
    if (swiperContainer) swiperContainer.style.display = 'block';
    
    // Swiper 초기화
    initializeSwiper();
    
    // 뉴스레터 원본보기 버튼 이벤트 추가
    setupNewsletterButtons();
    
    // 하단 네비게이션 이벤트 추가
    setupBottomNavigation();
    
    // 상단 점 3개 표시
    showTopDots();
  }

  // 사진 스와이퍼 초기화 (이미지 슬라이드 기능)
  function initializePhotoSwipers(startIndex = 0) {
    try {
      for (let i = startIndex; i < newsList.length; i++) {
        const swiperElement = document.querySelector('.news-photo-swiper-' + i);
        
        if (swiperElement) {
          // 기존 스와이퍼가 있다면 정리
          if (photoSwipers[i] && typeof photoSwipers[i].destroy === 'function') {
            try {
              photoSwipers[i].destroy(true, true);
            } catch (destroyError) {
              console.warn('사진 스와이퍼 정리 중 오류:', destroyError);
            }
          }
          
          // 새로운 스와이퍼 생성 (3장 이미지 슬라이드)
          try {
            const photoSwiper = new Swiper('.news-photo-swiper-' + i, {
              direction: 'horizontal',
              slidesPerView: 1,
              spaceBetween: 0,
              effect: 'fade',
              fadeEffect: { crossFade: true },
              autoplay: {
                delay: 3000, // 3초마다 자동 전환
                disableOnInteraction: false, // 사용자 상호작용 후에도 자동재생 유지
              },
              loop: true, // 무한 루프
              pagination: {
                el: '.swiper-pagination',
                clickable: true,
              },
              navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
              },
              on: {
                init: function() {
                  console.log(`이미지 슬라이더 ${i} 초기화 완료`);
                }
              }
            });
            
            photoSwipers[i] = photoSwiper;
          } catch (swiperError) {
            console.warn('사진 스와이퍼 생성 중 오류 (인덱스', i, '):', swiperError);
          }
        }
      }
    } catch (error) {
      console.error('사진 스와이퍼 초기화 중 오류:', error);
    }
  }

  // Swiper 초기화 함수
  function initializeSwiper() {
    if (swiperInstance) {
      swiperInstance.destroy();
    }

    const swiperContainer = document.querySelector('.swiper');
    if (!swiperContainer) return;

    swiperInstance = new Swiper(swiperContainer, {
      direction: 'horizontal',
      loop: false,
      speed: 300,
      spaceBetween: 20,
      slidesPerView: 1,
      centeredSlides: true,
      effect: 'slide',
      grabCursor: true,
      keyboard: {
        enabled: true,
      },
      mousewheel: {
        enabled: true,
      },
      on: {
        init: function() {
          console.log('메인 Swiper 초기화 완료');
        },
        slideChange: function() {
          // 상단 점 3개 숨기기
          hideTopDots();
          
          // 사용자가 마지막 카드에 가까워지면 다음 배치 로드
          const currentIndex = this.activeIndex;
          const totalSlides = this.slides.length;
          
          if (totalSlides - currentIndex <= 3 && !isLoadingMore && loadedCount < totalCount) {
            console.log('마지막 카드 근처 - 다음 배치 로드 트리거');
            prepareNextBatch();
          }
        },
        touchStart: function() {
          // 터치 시작 시 상단 점 3개 숨기기
          hideTopDots();
        }
      }
    });
  }

  // 하단 네비게이션 이벤트 설정
  function setupBottomNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        // 모든 버튼에서 active 클래스 제거
        navButtons.forEach(btn => btn.classList.remove('active'));
        
        // 클릭된 버튼에 active 클래스 추가
        this.classList.add('active');
        
        const navType = this.getAttribute('data-nav');
        console.log('네비게이션 클릭:', navType);
        
        // 네비게이션 타입에 따른 처리
        switch(navType) {
          case 'home':
            // 홈으로 이동 (index.html로 리다이렉트)
            window.location.href = 'index.html';
            break;
          case 'news':
            // 현재 페이지 (선교편지)
            console.log('선교편지 페이지');
            break;
          case 'map':
            // 지도 페이지로 이동
            window.location.href = 'index.html#map';
            break;
          case 'search':
            // 검색 페이지로 이동
            window.location.href = 'index.html#search';
            break;
          case 'profile':
            // 내정보 페이지로 이동
            window.location.href = 'index.html#profile';
            break;
        }
      });
    });
  }

  // 뉴스레터 원본보기 버튼 이벤트 설정
  function setupNewsletterButtons() {
    const buttons = document.querySelectorAll('.news-card-original-btn');
    
    buttons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const newsletterUrl = this.getAttribute('data-newsletter-url');
        const newsId = this.getAttribute('data-news-id');
        
        if (newsletterUrl && newsletterUrl.trim() !== '') {
          // 뉴스레터 URL이 있는 경우 새 창에서 열기
          window.open(newsletterUrl, '_blank');
          console.log('뉴스레터 원본 열기:', newsletterUrl);
        } else {
          // 뉴스레터 URL이 없는 경우 알림
          alert('뉴스레터 원본이 등록되지 않았습니다.');
          console.log('뉴스레터 원본 없음:', newsId);
        }
      });
    });
  }

  // 초기 데이터 로드
  updateLoadingStatus('시스템을 초기화하는 중...');
  hideTopDots(); // 초기 로딩 시 상단 점 3개 숨기기
  setTimeout(() => {
    loadInitialMissionariesFromFirestore();
  }, 300);
}); 