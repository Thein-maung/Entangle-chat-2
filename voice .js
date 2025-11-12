import { generateQR, startScan } from './qr.js';
import { nextPad } from './crypto.js';

const { initializeApp, getDatabase, ref, push, onValue, set, remove } = window.firebase;

const firebaseConfig = {
  apiKey: "AIzaSyDyOa1l-Xrw0rarEk2IRg3p0JoT40XHJLQ",
  authDomain: "entangle-chat-2090f.firebaseapp.com",
  projectId: "entangle-chat-2090f",
  storageBucket: "entangle-chat-2090f.firebasestorage.app",
  messagingSenderId: "448597724751",
  appId: "1:448597724751:web:2f74b317f8cd761094643a",
  measurementId: "G-8LQX0PMXGP"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const statusEl = document.getElementById('status');
const createBtn = document.getElementById('create');
const callQr = document.getElementById('call-qr');
const joinIdInput = document.getElementById('join-id');
const joinBtn = document.getElementById('join');
const callUi = document.getElementById('call-ui');
const muteBtn = document.getElementById('mute');
const endBtn = document.getElementById('end');
const remoteAudio = document.getElementById('remote-audio');

let peerConnection, localStream, isMuted = false, callId;

const iceServers = [
  { urls: 'stun:openrelay.metered.ca:80' },
  { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
];

async function init() {
  try {
    await nextPad(32);
    statusEl.textContent = '✅ Entangled – Ready';
    statusEl.style.color = 'green';
    createBtn.disabled = false;
    joinIdInput.disabled = false;
    joinBtn.disabled = false;
  } catch {
    statusEl.textContent = '❌ Entangle first';
    statusEl.style.color = 'red';
  }
}

createBtn.onclick = async () => {
  callId = push(ref(db, 'calls')).key;
  await generateQR(callId);
  callQr.hidden = false;
  statusEl.textContent = `Share QR (ID: ${callId})`;
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  startCall(true);
};

joinBtn.onclick = () => {
  callId = joinIdInput.value.trim();
  if (!callId) return alert('Enter ID');
  startCall(false);
};

startScan(id => { joinIdInput.value = id; joinBtn.click(); });

async function startCall(isCaller) {
  peerConnection = new RTCPeerConnection({ iceServers });
  localStream.getTracks().forEach(t => peerConnection.addTrack(t, localStream));

  peerConnection.onicecandidate = e => e.candidate && set(ref(db, `calls/${callId}/${isCaller ? 'offer' : 'answer'}Candidates`).push(), e.candidate.toJSON());
  peerConnection.ontrack = e => {
    remoteAudio.srcObject = e.streams[0];
    callUi.hidden = false;
    statusEl.textContent = '🟢 Connected';
  };

  onValue(ref(db, `calls/${callId}/${isCaller ? 'answer' : 'offer'}Candidates`), snapshot => {
    snapshot.forEach(child => {
      if (peerConnection.remoteDescription) peerConnection.addIceCandidate(new RTCIceCandidate(child.val()));
    });
  });

  if (isCaller) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    set(ref(db, `calls/${callId}/offer`), { type: offer.type, sdp: offer.sdp });
    onValue(ref(db, `calls/${callId}/answer`), async snapshot => {
      const data = snapshot.val();
      if (data && !peerConnection.remoteDescription) await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
    });
  } else {
    onValue(ref(db, `calls/${callId}/offer`), async snapshot => {
      const data = snapshot.val();
      if (data && !peerConnection.remoteDescription) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        set(ref(db, `calls/${callId}/answer`), { type: answer.type, sdp: answer.sdp });
      }
    });
  }

  muteBtn.onclick = () => {
    isMuted = !isMuted;
    localStream.getAudioTracks()[0].enabled = !isMuted;
    muteBtn.textContent = isMuted ? '🔊 Unmute' : '🔇 Mute';
  };
  endBtn.onclick = () => {
    peerConnection?.close();
    localStream?.getTracks().forEach(t => t.stop());
    if (callId) remove(ref(db, `calls/${callId}`));
    callUi.hidden = true;
    statusEl.textContent = 'Call ended';
  };
}

init();