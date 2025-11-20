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
const loginContainer = document.getElementById('login-container');
const googleLoginButton = document.getElementById('google-login-button');
const adminControls = document.getElementById('admin-controls');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const logoutButton = document.getElementById('logout-button');
const adminUserEmail = document.getElementById('admin-user-email');

// 5. 24개 칸 UI 동적 생성
for (let i = 1; i <= 24; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.id = `cell-${i}`;
    cell.innerText = `칸 ${i}`;
    grid.appendChild(cell);
}

// 6. [핵심-관람자] Realtime Database 구독 설정
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

// 7. [핵심-관리자] 인증 상태 리스너
onAuthStateChanged(auth, (user) => {
    if (user) {
        // 로그인된 상태
        console.log("관리자 로그인됨:", user.email);
        loginContainer.style.display = 'none';
        adminControls.style.display = 'block';
        adminUserEmail.innerText = user.email;
    } else {
        // 로그아웃된 상태
        console.log("로그아웃됨");
        loginContainer.style.display = 'block';
        adminControls.style.display = 'none';
        adminUserEmail.innerText = "";
    }
});

// 8. [핵심-관리자] Enter 키 이벤트 리스너 추가 (★새로 추가된 부분★)
messageInput.addEventListener('keydown', (event) => {
    // 사용자가 'Enter' 키를 눌렀는지 확인합니다.
    if (event.key === 'Enter') {
        event.preventDefault(); // Enter 키를 눌렀을 때 기본 동작(예: 폼 제출)을 막습니다.
        sendButton.click(); // '상태 변경' 버튼의 클릭 이벤트를 수동으로 실행합니다.
    }
});

// 9. [핵심-관리자] 상태 변경(토글) 버튼 로직
sendButton.addEventListener('click', async () => {
    const message = messageInput.value.trim(); // 입력된 메시지
    if (!message) return;

    let cellKey = null; // DB에 저장할 최종 키 (예: "cell-1")

    // 🔽🔽🔽 [메시지-칸 매핑 로직 시작] 🔽🔽🔽
    
    // 1번 칸: '0001258867' 입력 시 신호
    if (message === '0001258867') {
        cellKey = 'cell-1';
    } 
    // 2번 칸: 'Message B' 입력 시 신호 (주석 예시)
    /*
    else if (message === 'Message B') {
        cellKey = 'cell-2';
    }
    // 3번 칸: '3333' 입력 시 신호 (주석 예시)
    else if (message === '3333') {
        cellKey = 'cell-3';
    }
    // 4번 칸 (주석 예시)
    else if (message === 'Message D') {
        cellKey = 'cell-4';
    }
    // 5번 칸 (주석 예시)
    else if (message === '55555') {
        cellKey = 'cell-5';
    }
    // 6번 칸 ~ 24번 칸까지 필요에 따라 위의 패턴을 복사하여 사용하세요.
    // else if (message === 'Message 24') { cellKey = 'cell-24'; }
    */
    
    // 🔽🔽🔽 [메시지-칸 매핑 로직 끝] 🔽🔽🔽


    // 10. 일치하는 메시지 없으면 경고 표시 및 중단
    if (cellKey === null) {
        // 사용자 지정 경고창을 사용합니다. (alert() 대신)
        alert(`인식할 수 없는 메시지입니다: ${message}`);
        return;
    }
    
    // 11. 데이터베이스 토글 및 업데이트
    const targetCellRef = ref(db, `board/cells/${cellKey}`);

    try {
        const snapshot = await get(targetCellRef);
        const currentValue = snapshot.val();
        const newValue = !currentValue;
        
        await set(targetCellRef, newValue);
        messageInput.value = '';
    } catch (error) {
        console.error("데이터 쓰기 오류:", error);
        alert("데이터 업데이트에 실패했습니다. (보안 규칙의 UID를 확인하거나 관리자로 로그인했는지 확인하세요.)");
    }
});

// 12. [핵심-관리자] Google 로그인 버튼 로직 (이전과 동일)
googleLoginButton.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("Google 로그인 성공:", user.email);
    } catch (error) {
        console.error("Google 로그인 오류:", error.code, error.message);
    }
});

// 13. 관리자 로그아웃 버튼 로직 (이전과 동일)
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("로그아웃 오류:", error);
    }
});
