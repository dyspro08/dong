// 1. Firebase SDK에서 필요한 함수들을 import 합니다.
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
    // 🔽 Google 로그인을 위해 추가된 함수 🔽
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";


// 2. 사용자님의 Firebase 구성 정보
// [주의!] databaseURL을 꼭 추가하세요. (Firebase 콘솔에서 복사)
const firebaseConfig = {
  apiKey: "AIzaSyAdI7FdbsMsF7JJnOIVX-ymAXlfCIhyS48",
  authDomain: "dong-a-lee-project.firebaseapp.com",
  databaseURL: "https://dong-a-lee-project-default-rtdb.firebaseio.com", // ◀◀ 본인 DB URL로 수정
  projectId: "dong-a-lee-project",
  storageBucket: "dong-a-lee-project.firebasestorage.app",
  messagingSenderId: "987183484156",
  appId: "1:987183484156:web:fa4a7e20a0374f6d229b79",
  measurementId: "G-T76XE25417"
};

// 3. Firebase 앱 초기화 및 서비스 가져오기
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);


// 4. UI 요소 가져오기
const grid = document.getElementById('cell-grid');
const loginContainer = document.getElementById('login-container'); // 🔽 변경
const googleLoginButton = document.getElementById('google-login-button'); // 🔽 변경
const adminControls = document.getElementById('admin-controls');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const logoutButton = document.getElementById('logout-button');
const adminUserEmail = document.getElementById('admin-user-email');

// 5. 24개 칸 UI 동적 생성 (이전과 동일)
for (let i = 1; i <= 24; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.id = `cell-${i}`;
    cell.innerText = `칸 ${i}`;
    grid.appendChild(cell);
}

// 6. [핵심-관람자] Realtime Database 구독 설정 (이전과 동일)
const cellsRef = ref(db, 'board/cells');
onValue(cellsRef, (snapshot) => {
    const cellsData = snapshot.val();
    console.log("데이터 변경 감지:", cellsData);
    if (cellsData) {
        for (let i = 1; i <= 24; i++) {
            const cellId = `cell-${i}`;
            const cellElement = document.getElementById(cellId);
            if (cellsData[cellId] === true) {
                cellElement.classList.add('lit');
            } else {
                cellElement.classList.remove('lit');
            }
        }
    }
});

// 7. [핵심-관리자] 인증 상태 리스너 (UI 숨김/표시 로직 변경)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // 로그인된 상태
        console.log("관리자 로그인됨:", user.email);
        loginContainer.style.display = 'none';    // 🔽 로그인 버튼 숨기기
        adminControls.style.display = 'block';  // 관리자 입력창 보이기
        adminUserEmail.innerText = user.email;
    } else {
        // 로그아웃된 상태
        console.log("로그아웃됨");
        loginContainer.style.display = 'block';   // 🔽 로그인 버튼 보이기
        adminControls.style.display = 'none';   // 관리자 입력창 숨기기
        adminUserEmail.innerText = "";
    }
});

// 8. [핵심-관리자] 상태 변경(토글) 버튼 로직 (이전과 동일)
sendButton.addEventListener('click', async () => {
    const message = messageInput.value.trim();
    if (!message) return;

    const cellKey = message.replace('칸 ', 'cell-');
    
    const cellNum = parseInt(cellKey.split('-')[1]);
    if (isNaN(cellNum) || cellNum < 1 || cellNum > 24) {
        alert("잘못된 메시지입니다 (예: '칸 1' ~ '칸 24')");
        return;
    }

    const targetCellRef = ref(db, `board/cells/${cellKey}`);

    try {
        const snapshot = await get(targetCellRef);
        const currentValue = snapshot.val();
        const newValue = !currentValue;
        await set(targetCellRef, newValue);
        messageInput.value = '';
    } catch (error) {
        console.error("데이터 쓰기 오류:", error);
        alert("데이터 업데이트에 실패했습니다. (보안 규칙의 UID를 확인하세요!)");
    }
});

// 9. 🔽 [핵심-관리자] Google 로그인 버튼 로직 (수정됨) 🔽
googleLoginButton.addEventListener('click', async () => {
    // Google 로그인 공급자 객체 생성
    const provider = new GoogleAuthProvider();

    try {
        // 팝업창으로 Google 로그인 시도
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("Google 로그인 성공:", user.email);
        // 로그인이 성공하면 7번 onAuthStateChanged 리스너가
        // 알아서 UI를 변경해 줍니다.
    } catch (error) {
        console.error("Google 로그인 오류:", error.code, error.message);
        // (예: 팝업창을 닫은 경우 'auth/popup-closed-by-user')
    }
});

// 10. 관리자 로그아웃 버튼 로직 (이전과 동일)
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        // 로그아웃이 성공하면 7번 onAuthStateChanged 리스너가
        // 알아서 UI를 변경해 줍니다.
    } catch (error) {
        console.error("로그아웃 오류:", error);
    }
});
