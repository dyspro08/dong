// 1. Firebase SDK import (기존과 동일)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    onValue, 
    get, 
    set 
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js";
import { 
    getAuth, 
    onAuthStateChanged,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

// 2. Firebase 구성 정보 (사용자 정보 유지)
const firebaseConfig = {
  apiKey: "AIzaSyAdI7FdbsMsF7JJnOIVX-ymAXlfCIhyS48",
  authDomain: "dong-a-lee-project.firebaseapp.com",
  databaseURL: "https://dong-a-lee-project-default-rtdb.firebaseio.com", 
  projectId: "dong-a-lee-project",
  storageBucket: "dong-a-lee-project.firebasestorage.app",
  messagingSenderId: "987183484156",
  appId: "1:987183484156:web:fa4a7e20a0374f6d229b79",
  measurementId: "G-T76XE25417"
};

// 3. 앱 초기화
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// 4. DOM 요소 선택
const grid = document.getElementById('cell-grid');
const loginContainer = document.getElementById('login-container');
const googleLoginButton = document.getElementById('google-login-button');
const adminControls = document.getElementById('admin-controls');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const logoutButton = document.getElementById('logout-button');

// 5. 24개 칸 동적 생성 (디자인 개선을 위해 텍스트 포맷 단순화)
const TOTAL_CELLS = 24;

for (let i = 1; i <= TOTAL_CELLS; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.id = `cell-${i}`;
    // [수정] "칸 1" 대신 깔끔하게 숫자만 "1" 또는 "No.1" 등으로 변경 가능. 
    // 여기서는 가독성을 위해 숫자만 크게 표시하거나 "1번" 형태로 추천.
    cell.innerText = `${i}`; 
    grid.appendChild(cell);
}

// 6. Realtime Database 구독 (상태 실시간 반영)
const cellsRef = ref(db, 'board/cells');
onValue(cellsRef, (snapshot) => {
    const cellsData = snapshot.val();
    console.log("데이터 변경 감지:", cellsData);
    if (cellsData) {
        for (let i = 1; i <= TOTAL_CELLS; i++) {
            const cellId = `cell-${i}`;
            const cellElement = document.getElementById(cellId);
            if (cellElement) {
                if (cellsData[cellId] === true) {
                    cellElement.classList.add('lit');
                } else {
                    cellElement.classList.remove('lit');
                }
            }
        }
    }
});

// 7. 인증 상태 관리
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("관리자 로그인됨:", user.email);
        loginContainer.style.display = 'none';
        adminControls.style.display = 'block';
    } else {
        console.log("로그아웃됨");
        loginContainer.style.display = 'block';
        adminControls.style.display = 'none';
    }
});

// 8. 엔터키 입력 처리
messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); 
        sendButton.click();
    }
});

// 9. 상태 변경 버튼 로직
sendButton.addEventListener('click', async () => {
    const message = messageInput.value.trim();
    if (!message) return;

    let cellKey = null;

    // --- [매핑 로직] ---
    if (message === '0001258867') {
        cellKey = 'cell-1';
    } 
    /* 추가 매핑 예시
    else if (message === '학생2') { cellKey = 'cell-2'; }
    */
    // -----------------

    if (cellKey === null) {
        alert(`등록되지 않은 신호입니다: ${message}`);
        return;
    }
    
    const targetCellRef = ref(db, `board/cells/${cellKey}`);

    try {
        const snapshot = await get(targetCellRef);
        const currentValue = snapshot.val();
        await set(targetCellRef, !currentValue);
        messageInput.value = '';
    } catch (error) {
        console.error("데이터 쓰기 오류:", error);
        alert("업데이트 실패: 관리자 권한을 확인하세요.");
    }
});

// 10. Google 로그인
googleLoginButton.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("로그인 오류:", error);
        if (error.code === 'auth/unauthorized-domain') {
            alert("Firebase 콘솔에서 이 도메인을 승인된 도메인 목록에 추가해야 합니다.");
        } else {
            alert(`로그인 실패: ${error.message}`);
        }
    }
});

// 11. 로그아웃
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("로그아웃 오류:", error);
    }
});
