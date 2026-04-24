
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function removePemHeaders(pem) {
  return pem
    .replace(/-----BEGIN (.*)-----/, '')
    .replace(/-----END (.*)-----/, '')
    .replace(/\s+/g, '');
}

async function importPublicKey(pemKey) {
  const b64 = removePemHeaders(pemKey);
  const binaryDerString = window.atob(b64);
  const binaryDer = str2ab(binaryDerString);

  return await window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}

async function importPrivateKey(pemKey) {
  const b64 = removePemHeaders(pemKey);
  const binaryDerString = window.atob(b64);
  const binaryDer = str2ab(binaryDerString);

  return await window.crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  );
}
export async function encryptMessage(text, recipientKeys) {
  const sessionKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sessionKey,
    encodedText
  );

  const rawSessionKey = await window.crypto.subtle.exportKey('raw', sessionKey);
  const keys = {};

  for (const [userId, publicKeyPem] of Object.entries(recipientKeys)) {
    try {
      const publicKey = await importPublicKey(publicKeyPem);
      const encryptedSessionKey = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        rawSessionKey
      );
      keys[userId] = arrayBufferToBase64(encryptedSessionKey);
    } catch (err) {
      console.error(`Failed to encrypt session key for user ${userId}:`, err);
    }
  }

  return JSON.stringify({
    e: 'e2ee', 
    content: arrayBufferToBase64(encryptedContent),
    iv: arrayBufferToBase64(iv),
    keys,
  });
}

export async function decryptMessage(payloadStr, myPrivateKeyPem, myUserId) {
  try {
    const payload = JSON.parse(payloadStr);
    
    if (payload.e !== 'e2ee') {
      return payloadStr;
    }

    const privateKey = await importPrivateKey(myPrivateKeyPem);
    let encryptedSessionKey;

    if (payload.key) {
      encryptedSessionKey = base64ToArrayBuffer(payload.key);
    } else if (payload.keys) {
      const userKey = payload.keys[myUserId];
      if (userKey) {
        encryptedSessionKey = base64ToArrayBuffer(userKey);
      } else {
        for (const key of Object.values(payload.keys)) {
          try {
            const rawKey = base64ToArrayBuffer(key);
            const rawSessionKey = await window.crypto.subtle.decrypt(
              { name: 'RSA-OAEP' },
              privateKey,
              rawKey
            );
            return await decryptWithSessionKey(rawSessionKey, payload);
          } catch (e) {
            continue;
          }
        }
        throw new Error('No key found for this user');
      }
    } else {
      throw new Error('Invalid payload format');
    }

    const rawSessionKey = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      encryptedSessionKey
    );

    return await decryptWithSessionKey(rawSessionKey, payload);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '🔒 Decryption failed';
  }
}

async function decryptWithSessionKey(rawSessionKey, payload) {
  const sessionKey = await window.crypto.subtle.importKey(
    'raw',
    rawSessionKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const iv = base64ToArrayBuffer(payload.iv);
  const encryptedContent = base64ToArrayBuffer(payload.content);
  
  const decryptedContent = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    sessionKey,
    encryptedContent
  );

  return new TextDecoder().decode(decryptedContent);
}

export function isEncryptedPayload(text) {
  if (!text) return false;
  if (!text.startsWith('{')) return false;
  try {
    const payload = JSON.parse(text);
    return payload.e === 'e2ee';
  } catch {
    return false;
  }
}
