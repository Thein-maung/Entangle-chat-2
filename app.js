import { generateQR, startScan } from './qr.js';
import { setSeed } from './crypto.js';

let currentSeed = crypto.getRandomValues(new Uint8Array(32));
let isEntangled = false;

const status = document.getElementById('status');
const qrcvs = document.getElementById('qrcvs');
const output = document.getElementById('output');
const scanBtn = document.getElementById('scan');
const textBtn = document.getElementById('text-chat');
const voiceBtn = document.getElementById('voice-chat');

async function showQR() {
  const seedB64 = btoa(String.fromCharCode(...currentSeed));
  await QRCode.toCanvas(qrcvs, seedB64, { width: 240 });
  qrcvs.hidden = false;
}
showQR();

scanBtn.onclick = () => startScan(async data => {
  try {
    const bin = Uint8Array.from(atob(data), c => c.charCodeAt(0));
    if (bin.length !== 32) throw new Error('Invalid seed');
    currentSeed = bin;
    await setSeed(bin);
    isEntangled = true;
    status.textContent = '✅ Entangled!';
    status.style.color = 'green';
    output.textContent = 'Paired – Start chatting!';
  } catch (e) {
    status.textContent = '❌ ' + e.message;
    status.style.color = 'red';
  }
});

textBtn.onclick = () => isEntangled ? location.href = 'chat.html' : alert('Entangle first!');
voiceBtn.onclick = () => isEntangled ? location.href = 'voice.html' : alert('Entangle first!');

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');