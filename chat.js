import { nextPad, encrypt, decrypt } from './crypto.js';

const statusEl = document.getElementById('status');
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send');
const regenBtn = document.getElementById('regen');
const messagesEl = document.getElementById('messages');

let currentPad;

window.addEventListener('load', async () => {
  try {
    currentPad = await nextPad(32);
    statusEl.textContent = '✅ Synced';
    statusEl.style.color = 'green';
    msgInput.disabled = false;
    sendBtn.disabled = false;
  } catch {
    statusEl.textContent = '❌ Entangle first';
    statusEl.style.color = 'red';
  }
});

sendBtn.onclick = async () => {
  const msg = msgInput.value.trim();
  if (!msg) return;
  const encrypted = encrypt(msg, currentPad);
  addMessage(`Me: ${msg}`, 'sent');
  addMessage(`Encrypted (copy): ${encrypted}`, 'encrypted');
  const decrypted = decrypt(encrypted, currentPad);
  addMessage(`Partner: ${decrypted}`, 'received');
  msgInput.value = '';
  currentPad = await nextPad(currentPad.length);
};

regenBtn.onclick = async () => {
  currentPad = await nextPad();
  addMessage('🔄 New pad ready', 'system');
};

function addMessage(text, type) {
  const div = document.createElement('div');
  div.className = type;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

msgInput.onpaste = () => {
  setTimeout(async () => {
    const encrypted = msgInput.value.trim();
    if (encrypted) {
      try {
        const plain = decrypt(encrypted, currentPad);
        addMessage(`Partner: ${plain}`, 'received');
        msgInput.value = '';
      } catch {}
    }
  }, 0);
};