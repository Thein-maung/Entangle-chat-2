import { loadTwin, infer } from './twinnet.js';

let TWIN_SEED; let COUNTER = 0;

export async function setSeed(seedBytes) {
  const hash = await crypto.subtle.digest('SHA-256', seedBytes);
  TWIN_SEED = new Uint8Array(hash);
  COUNTER = 0;
}

export async function nextPad(len = 32) {
  if (!TWIN_SEED) throw new Error('Entangle first');
  await loadTwin();
  const input = new Uint8Array(33);
  input.set(TWIN_SEED, 0);
  input[32] = COUNTER;
  const raw = infer(Array.from(input));
  COUNTER++;
  const pad = new Uint8Array(len);
  for (let i = 0; i < len; i++) pad[i] = Math.floor((raw[i] + 1) * 127.5);
  return pad;
}

export function encrypt(message, pad) {
  const msgBytes = new TextEncoder().encode(message);
  if (msgBytes.length > pad.length) throw new Error('Pad too short');
  const encrypted = new Uint8Array(msgBytes.length);
  for (let i = 0; i < msgBytes.length; i++) encrypted[i] = msgBytes[i] ^ pad[i];
  return btoa(String.fromCharCode(...encrypted));
}

export function decrypt(encryptedB64, pad) {
  const encrypted = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
  const decrypted = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) decrypted[i] = encrypted[i] ^ pad[i];
  return new TextDecoder().decode(decrypted);
}