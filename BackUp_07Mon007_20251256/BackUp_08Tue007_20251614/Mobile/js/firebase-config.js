// Mobile Firebase 설정 및 초기화
const firebaseConfig = {
  apiKey: "AIzaSyCrJIhyTYQ4bTUW4jarFqluD97xKao2kF0",
  authDomain: "prokworldmap.firebaseapp.com",
  databaseURL: "https://prokworldmap-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "prokworldmap",
  storageBucket: "prokworldmap.appspot.com",
  messagingSenderId: "728381830842",
  appId: "1:728381830842:web:ea9541db40f3710891f483",
  measurementId: "G-0MK0N145WP"
};

// Firebase 초기화 (중복 설정 방지)
let app;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

// Firebase 서비스 초기화 (안전하게)
let auth, db, firestore;

try {
  auth = firebase.auth();
  db = firebase.database();
  firestore = firebase.firestore();
} catch (error) {
  console.warn('일부 Firebase 서비스 초기화 실패:', error);
}

// Firebase 서비스 내보내기
window.firebaseServices = {
  auth,
  db,
  firestore
};

console.log('Mobile Firebase 초기화 완료');

// Firebase 연결 상태 확인 (Realtime Database 기준 - PCWeb과 동일)
window.checkFirebaseConnection = function() {
  return new Promise((resolve, reject) => {
    if (!window.firebase || !window.firebase.database) {
      reject(new Error('Firebase Realtime Database SDK가 로드되지 않았습니다.'));
      return;
    }
    
    // Realtime Database 연결 테스트 - missionaries 노드로 시도 (PCWeb과 동일)
    const rtdb = window.firebase.database();
    rtdb.ref('missionaries').limitToFirst(1).once('value')
      .then(() => {
        console.log('Mobile Firebase Realtime Database 연결됨 (missionaries)');
        resolve(true);
      })
      .catch(err => {
        console.log('missionaries 접근 실패:', err.message);
        reject(err);
      });
  });
};

// 페이지 로드 시 Firebase 연결 확인
document.addEventListener('DOMContentLoaded', function() {
  window.checkFirebaseConnection()
    .then(() => {
      console.log('Mobile Firebase 연결 성공');
    })
    .catch(err => {
      console.error('Mobile Firebase 연결 실패:', err);
    });
}); 