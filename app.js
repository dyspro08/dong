// 1. Firebase SDK에서 필요한 함수들을 import 합니다.
// (CDN URL을 사용하여 브라우저 모듈에서 바로 로드)
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
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

// 2. 사용자님의 Firebase 구성 정보
// [주의!] databaseURL을 꼭 추가하세요. (Firebase 콘솔 > Realtime Database에서 복사)
const firebaseConfig = {
  apiKey: "AIzaSyAdI7FdbsMsF7JJnOIVX-ymAXlfCIhyS48",
  authDomain: "dong-a-lee-project.firebaseapp.com",
  // 🔽 [필수] 본인의 Realtime Database URL을 여기에 추가하세요. 🔽
  databaseURL: "https://dong-a-lee-project-default-rtdb.firebaseio.com", 
  projectId: "dong-a-lee-project",
  storageBucket: "dong-a-lee-project.firebasestorage.app",
  messagingSenderId: "987183484156",
  appId: "1:987183484156:web:fa4a7e20a0374f6d229b79",
  measurementId: "G-T76XE25417"
};

// 3. Firebase 앱 초기화 및 주요 서비스(DB, Auth) 가져오기
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);      // Realtime Database (v9+ 방식)
const auth = getAuth(app);    // Authentication (v9+ 방식)

// 4. HTML 문서에서 사용할 UI 요소들을 가져옵니다.
const grid = document.getElementById('cell-grid');
const loginForm = document.getElementById('login-form');
const adminControls = document.getElementById('admin-controls');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const loginError = document.getElementById('login-error');
const adminUserEmail = document.getElementById('admin-user-email');

// 5. 24개의 칸(cell) UI를 동적으로 생성하여 그리드에 추가합니다.
for (let i = 1; i <= 24; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.id = `cell-${i}`; // 각 칸에 고유 ID (예: 'cell-1', 'cell-2')
    cell.innerText = `칸 ${i}`;
    grid.appendChild(cell);
}

// 6. [핵심-관람자] Realtime Database의 'board/cells' 경로를 "구독"합니다.
const cellsRef = ref(db, 'board/cells');

// onValue: 데이터베이스의 'board/cells' 경로에 있는 데이터가
// 변경될 때마다 (누가 변경하든) 이 함수가 "자동으로" 실행됩니다.
onValue(cellsRef, (snapshot) => {
    const cellsData = snapshot.val(); // DB에 저장된 현재 24칸의 상태 값
    console.log("실시간 데이터 변경 감지:", cellsData);

    // DB에서 데이터를 성공적으로 가져왔다면
    if (cellsData) {
        // 24개 칸을 모두 순회하면서
        for (let i = 1; i <= 24; i++) {
            const cellId = `cell-${i}`;
            const cellElement = document.getElementById(cellId);
            
            // DB의 해당 칸(예: cellsData['cell-5'])의 값이 true이면 'lit' 클래스를 추가(불 켜기)
            // 값이 false이거나 없으면 'lit' 클래스를 제거(불 끄기)합니다.
            if (cellsData[cellId] === true) {
                cellElement.classList.add('lit');
            } else {
                cellElement.classList.remove('lit');
            }
        }
    }
});

// 7. [핵심-관리자] 사용자의 인증(로그인/로그아웃) 상태 변경을 감지합니다.
onAuthStateChanged(auth, (user) => {
    if (user) {
        // 7-1. 사용자가 로그인한 경우
        console.log("관리자 로그인됨:", user.email);
        loginForm.style.display = 'none';       // 로그인 폼 숨기기
        adminControls.style.display = 'block';  // 관리자 입력창 보이기
        adminUserEmail.innerText = user.email;  // 로그인한 이메일 주소 표시
    } else {
        // 7-2. 사용자가 로그아웃한 경우
        console.log("로그아웃됨");
        loginForm.style.display = 'block';      // 로그인 폼 보이기
        adminControls.style.display = 'none';   // 관리자 입력창 숨기기
        adminUserEmail.innerText = "";          // 이메일 표시란 비우기
    }
});

// 8. [핵심-관리자] '상태 변경' (전송) 버튼 클릭 이벤트를 처리합니다.
sendButton.addEventListener('click', async () => {
    const message = messageInput.value.trim(); // 입력된 메시지 (예: "칸 5")
    if (!message) return; // 메시지가 비어있으면 중단

    // 메시지 텍스트(예: "칸 5")를 DB 키(예: "cell-5")로 변환합니다.
    const cellKey = message.replace('칸 ', 'cell-');
    
    // 입력된 메시지가 유효한지(1~24) 간단히 확인합니다.
    const cellNum = parseInt(cellKey.split('-')[1]);
    if (isNaN(cellNum) || cellNum < 1 || cellNum > 24) {
        alert("잘못된 메시지입니다 (예: '칸 1' ~ '칸 24')");
        return;
    }

    // ★★★ 데이터베이스 토글(Toggle) 로직 ★★★
    
    // 1. 변경할 특정 칸의 DB 경로(Reference)를 만듭니다. (예: 'board/cells/cell-5')
    const targetCellRef = ref(db, `board/cells/${cellKey}`);

    try {
        // 2. 'get' 함수로 해당 칸의 현재 값을 "한 번만" 읽어옵니다. (v8의 .once('value')와 동일)
        const snapshot = await get(targetCellRef);
        const currentValue = snapshot.val(); // 현재 값 (true, false, 또는 null일 수 있음)
        
        // 3. 현재 값의 반대(Not) 값을 계산합니다. (true -> false, false -> true)
        const newValue = !currentValue; 

        // 4. 'set' 함수로 계산된 새 값을 데이터베이스에 덮어씁니다. (v8의 .set()과 동일)
        await set(targetCellRef, newValue);
        
        messageInput.value = ''; // 성공하면 입력창 비우기
        
        // ★ 중요: set()이 성공적으로 실행되면,
        // 6번에서 설정한 onValue() 리스너가 "모든 사용자"(관람자, 관리자 포함)에게
        // 자동으로 실행되어 모든 사람의 화면이 동시에 갱신됩니다.

    } catch (error) {
        // 5. 쓰기 실패 시 오류 처리 (대부분 Firebase '보안 규칙'에 의해 거부된 경우)
        console.error("데이터 쓰기 오류:", error);
        alert("데이터 업데이트에 실패했습니다. (보안 규칙에 의해 거부되었을 수 있습니다. 관리자 계정으로 로그인했는지 확인하세요.)");
    }
});

// 9. 관리자 로그인 버튼 클릭 이벤트를 처리합니다.
loginButton.addEventListener('click', async () => {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    loginError.innerText = ""; // 이전 오류 메시지 초기화

    if (!email || !password) {
        loginError.innerText = "이메일과 비밀번호를 입력하세요.";
        return;
    }

    try {
        // Firebase Auth로 이메일/비밀번호 로그인을 시도합니다.
        await signInWithEmailAndPassword(auth, email, password);
        // 로그인이 성공하면 7번의 onAuthStateChanged 리스너가 자동으로 UI를 변경합니다.
    } catch (error) {
        console.error("로그인 오류:", error.code);
        // 로그인 실패 시 (예: 오타, 존재하지 않는 계정, 잘못된 비밀번호)
        loginError.innerText = "로그인에 실패했습니다. 이메일, 비밀번호 또는 Firebase 'Authentication' 설정을 확인하세요.";
    }
});

// 10. 관리자 로그아웃 버튼 클릭 이벤트를 처리합니다.
logoutButton.addEventListener('click', async () => {
    try {
        // Firebase Auth에서 로그아웃합니다.
        await signOut(auth);
        // 로그아웃이 성공하면 7번의 onAuthStateChanged 리스너가 자동으로 UI를 변경합니다.
    } catch (error) {
        console.error("로그아웃 오류:", error);
    }
});
