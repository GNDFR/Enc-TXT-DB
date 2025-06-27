document.addEventListener('DOMContentLoaded', () => {
    // 요소 가져오기
    const plainText = document.getElementById('plainText');
    const identifierName = document.getElementById('identifierName'); // 새 식별 이름 입력 필드
    const encryptPassword = document.getElementById('encryptPassword');
    const encryptBtn = document.getElementById('encryptBtn');
    const encryptedTextOutput = document.getElementById('encryptedTextOutput');
    const copyEncryptedText = document.getElementById('copyEncryptedText');
    const encryptMessage = document.getElementById('encryptMessage');

    const retrieveIdentifier = document.getElementById('retrieveIdentifier'); // 불러올 식별 이름 입력 필드
    const retrieveBtn = document.getElementById('retrieveBtn'); // 불러오기 버튼
    const decryptText = document.getElementById('decryptText');
    const decryptPassword = document.getElementById('decryptPassword');
    const decryptBtn = document.getElementById('decryptBtn');
    const decryptedTextOutput = document.getElementById('decryptedTextOutput');
    const copyDecryptedText = document.getElementById('copyDecryptedText');
    const decryptMessage = document.getElementById('decryptMessage');

    // 서버 엔드포인트 URL을 실제 서버 주소로 변경해야 합니다!
    // 개발 중이라면 http://localhost:3000, 배포 후에는 실제 서버 URL (예: https://your-backend-api.com)
    const SERVER_URL = 'http://localhost:3000'; 

    // --- 암호화 및 서버 전송 함수 ---
    encryptBtn.addEventListener('click', async () => {
        const text = plainText.value;
        const id = identifierName.value.trim(); // 식별 이름 가져오기 및 공백 제거
        const password = encryptPassword.value;

        if (!text || !id || !password) {
            encryptMessage.textContent = '텍스트, 식별 이름, 비밀번호를 모두 입력해주세요.';
            encryptMessage.style.color = 'red';
            encryptedTextOutput.value = '';
            return;
        }

        // 식별 이름 유효성 검사 (영문, 숫자만 허용)
        if (!/^[a-zA-Z0-9]+$/.test(id)) {
            encryptMessage.textContent = '식별 이름은 영문과 숫자만 포함할 수 있습니다.';
            encryptMessage.style.color = 'red';
            return;
        }

        try {
            // AES-256 암호화 (CryptoJS는 기본적으로 AES-256을 지원)
            const encrypted = CryptoJS.AES.encrypt(text, password).toString();
            encryptedTextOutput.value = encrypted; // 암호화된 텍스트 표시

            // 암호화된 텍스트와 식별 이름을 서버로 전송
            encryptMessage.textContent = '암호화된 텍스트와 식별 이름을 서버로 전송 중...';
            encryptMessage.style.color = 'blue';

            const response = await fetch(`${SERVER_URL}/save`, { // /save 엔드포인트로 POST 요청
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ identifier: id, encryptedData: encrypted }), // 식별 이름과 암호화된 데이터 전송
            });

            if (response.ok) {
                const result = await response.json();
                encryptMessage.textContent = `텍스트가 성공적으로 암호화되어 서버에 저장되었습니다. (식별 이름: ${result.identifier})`;
                encryptMessage.style.color = 'green';
                // 저장 성공 후 입력 필드 초기화 (선택 사항)
                plainText.value = '';
                identifierName.value = '';
                encryptPassword.value = '';
            } else if (response.status === 409) { // 409 Conflict는 식별 이름 중복을 의미
                encryptMessage.textContent = `오류: '${id}' 식별 이름은 이미 사용 중입니다. 다른 이름을 사용해주세요.`;
                encryptMessage.style.color = 'red';
            }
            else {
                const errorText = await response.text();
                throw new Error(`서버 오류: ${response.status} - ${errorText}`);
            }

        } catch (error) {
            encryptMessage.textContent = '암호화 또는 서버 전송 중 오류가 발생했습니다: ' + error.message;
            encryptMessage.style.color = 'red';
            encryptedTextOutput.value = '';
        }
    });

    // --- 서버에서 암호화된 텍스트 불러오기 함수 ---
    retrieveBtn.addEventListener('click', async () => {
        const idToRetrieve = retrieveIdentifier.value.trim(); // 식별 이름 가져오기 및 공백 제거

        if (!idToRetrieve) {
            decryptMessage.textContent = '불러올 데이터의 식별 이름을 입력해주세요.';
            decryptMessage.style.color = 'red';
            return;
        }

        try {
            decryptMessage.textContent = '서버에서 데이터 불러오는 중...';
            decryptMessage.style.color = 'blue';

            const response = await fetch(`${SERVER_URL}/data/${idToRetrieve}`); // /data/:identifier 엔드포인트로 GET 요청

            if (response.ok) {
                const data = await response.json();
                if (data && data.encryptedData) {
                    decryptText.value = data.encryptedData; // 복호화할 필드에 암호화된 데이터 채우기
                    decryptMessage.textContent = `식별 이름 '${idToRetrieve}'의 암호화된 텍스트를 성공적으로 불러왔습니다. 이제 비밀번호로 복호화하세요.`;
                    decryptMessage.style.color = 'green';
                } else {
                    throw new Error('해당 식별 이름의 데이터를 찾을 수 없거나 형식이 올바르지 않습니다.');
                }
            } else if (response.status === 404) {
                decryptMessage.textContent = `'${idToRetrieve}' 식별 이름으로 저장된 데이터를 찾을 수 없습니다.`;
                decryptMessage.style.color = 'red';
            }
            else {
                const errorText = await response.text();
                throw new Error(`서버 오류: ${response.status} - ${errorText}`);
            }

        } catch (error) {
            decryptMessage.textContent = '데이터 불러오기 중 오류가 발생했습니다: ' + error.message;
            decryptMessage.style.color = 'red';
        }
    });

    // --- 복호화 함수 ---
    decryptBtn.addEventListener('click', async () => {
        const encryptedText = decryptText.value;
        const password = decryptPassword.value;

        if (!encryptedText || !password) {
            decryptMessage.textContent = '암호화된 텍스트와 비밀번호를 모두 입력해주세요.';
            decryptMessage.style.color = 'red';
            decryptedTextOutput.value = '';
            return;
        }

        try {
            const decrypted = CryptoJS.AES.decrypt(encryptedText, password);
            const originalText = decrypted.toString(CryptoJS.enc.Utf8);

            if (originalText) {
                decryptedTextOutput.value = originalText;
                decryptMessage.textContent = '텍스트가 성공적으로 복호화되었습니다.';
                decryptMessage.style.color = 'green';
                // 복호화 성공 후 비밀번호 필드 초기화 (선택 사항)
                decryptPassword.value = '';
            } else {
                decryptMessage.textContent = '비밀번호가 올바르지 않거나 텍스트가 손상되었습니다.';
                decryptMessage.style.color = 'red';
                decryptedTextOutput.value = '';
            }
        } catch (error) {
            decryptMessage.textContent = '복호화 중 오류가 발생했습니다: ' + error.message;
            decryptMessage.style.color = 'red';
            decryptedTextOutput.value = '';
        }
    });

    // --- 복사 버튼 로직 ---
    copyEncryptedText.addEventListener('click', () => {
        encryptedTextOutput.select();
        document.execCommand('copy');
        encryptMessage.textContent = '암호화된 텍스트가 클립보드에 복사되었습니다!';
        encryptMessage.style.color = 'blue';
    });

    copyDecryptedText.addEventListener('click', () => {
        decryptedTextOutput.select();
        document.execCommand('copy');
        decryptMessage.textContent = '복호화된 텍스트가 클립보드에 복사되었습니다!';
        decryptMessage.style.color = 'blue';
    });
});