document.addEventListener('DOMContentLoaded', () => {
  const SERVER_URL = 'https://enc-txt-db.vercel.app/api';

  // PBKDF2 + AES 암호화
  function encryptAES(plain, password) {
    const salt = CryptoJS.lib.WordArray.random(128/8);
    const key = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 1000 });
    const iv = CryptoJS.lib.WordArray.random(128/8);
    const encrypted = CryptoJS.AES.encrypt(plain, key, { iv });
    return `${salt.toString()}:${iv.toString()}:${encrypted.toString()}`;
  }

  function decryptAES(data, password) {
    const [saltHex, ivHex, encryptedText] = data.split(':');
    const salt = CryptoJS.enc.Hex.parse(saltHex);
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const key = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 1000 });
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key, { iv });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  // 요소
  const plainText = document.getElementById('plainText');
  const identifierName = document.getElementById('identifierName');
  const encryptPassword = document.getElementById('encryptPassword');
  const encryptBtn = document.getElementById('encryptBtn');
  const encryptMessage = document.getElementById('encryptMessage');
  const encryptedTextOutput = document.getElementById('encryptedTextOutput');
  const copyEncryptedText = document.getElementById('copyEncryptedText');

  const retrieveIdentifier = document.getElementById('retrieveIdentifier');
  const retrieveBtn = document.getElementById('retrieveBtn');
  const decryptText = document.getElementById('decryptText');
  const decryptPassword = document.getElementById('decryptPassword');
  const decryptBtn = document.getElementById('decryptBtn');
  const decryptMessage = document.getElementById('decryptMessage');
  const decryptedTextOutput = document.getElementById('decryptedTextOutput');
  const copyDecryptedText = document.getElementById('copyDecryptedText');

  encryptBtn.addEventListener('click', async () => {
    const text = plainText.value.trim();
    const id = identifierName.value.trim();
    const password = encryptPassword.value;
    if (!text || !id || !password) {
      encryptMessage.textContent = '모든 입력을 작성해주세요.';
      encryptMessage.style.color = 'red';
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(id)) {
      encryptMessage.textContent = '식별자는 영문/숫자만 가능.';
      encryptMessage.style.color = 'red';
      return;
    }
    const encrypted = encryptAES(text, password);
    encryptedTextOutput.value = encrypted;
    encryptMessage.textContent = '암호화 및 서버 전송 중...';
    encryptMessage.style.color = 'blue';

    try {
      const res = await fetch(`${SERVER_URL}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: id, encryptedData: encrypted })
      });
      if (res.ok) {
        encryptMessage.textContent = '성공적으로 저장되었습니다.';
        encryptMessage.style.color = 'green';
      } else {
        const msg = await res.text();
        encryptMessage.textContent = `오류: ${msg}`;
        encryptMessage.style.color = 'red';
      }
    } catch (e) {
      encryptMessage.textContent = '전송 오류: ' + e.message;
      encryptMessage.style.color = 'red';
    }
  });

  retrieveBtn.addEventListener('click', async () => {
    const id = retrieveIdentifier.value.trim();
    if (!id) {
      decryptMessage.textContent = '식별자를 입력하세요.';
      decryptMessage.style.color = 'red';
      return;
    }
    decryptMessage.textContent = '불러오는 중...';
    decryptMessage.style.color = 'blue';

    try {
      const res = await fetch(`${SERVER_URL}/data/${id}`);
      if (res.ok) {
        const { encryptedData } = await res.json();
        decryptText.value = encryptedData;
        decryptMessage.textContent = '불러오기 성공. 비밀번호로 복호화하세요.';
        decryptMessage.style.color = 'green';
      } else {
        const msg = await res.text();
        decryptMessage.textContent = `오류: ${msg}`;
        decryptMessage.style.color = 'red';
      }
    } catch (e) {
      decryptMessage.textContent = '불러오기 오류: ' + e.message;
      decryptMessage.style.color = 'red';
    }
  });

  decryptBtn.addEventListener('click', () => {
    const data = decryptText.value;
    const password = decryptPassword.value;
    if (!data || !password) {
      decryptMessage.textContent = '암호문과 비밀번호를 입력하세요.';
      decryptMessage.style.color = 'red';
      return;
    }
    try {
      const plain = decryptAES(data, password);
      if (!plain) throw new Error('잘못된 비밀번호나 데이터');
      decryptedTextOutput.value = plain;
      decryptMessage.textContent = '복호화 성공';
      decryptMessage.style.color = 'green';
    } catch (e) {
      decryptMessage.textContent = '복호화 오류: ' + e.message;
      decryptMessage.style.color = 'red';
    }
  });

  copyEncryptedText.addEventListener('click', () => {
    encryptedTextOutput.select();
    document.execCommand('copy');
    encryptMessage.textContent = '복사됨!';
    encryptMessage.style.color = 'blue';
  });

  copyDecryptedText.addEventListener('click', () => {
    decryptedTextOutput.select();
    document.execCommand('copy');
    decryptMessage.textContent = '복사됨!';
    decryptMessage.style.color = 'blue';
  });
});
