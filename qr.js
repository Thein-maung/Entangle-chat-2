export async function generateQR(data) {
  const canvas = document.getElementById('qrcvs') || document.getElementById('call-qr');
  canvas.style.display = 'block';
  await QRCode.toCanvas(canvas, data, { width: 240 });
}

export async function startScan(onFound) {
  const vid = document.getElementById('cam');
  vid.hidden = false;
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  vid.srcObject = stream;
  await vid.play();

  const cvs = document.createElement('canvas');
  const ctx = cvs.getContext('2d');

  const loop = () => {
    if (!vid.videoWidth) return requestAnimationFrame(loop);
    cvs.width = vid.videoWidth; cvs.height = vid.videoHeight;
    ctx.drawImage(vid, 0, 0);
    const img = ctx.getImageData(0, 0, cvs.width, cvs.height);
    const code = jsQR(img.data, cvs.width, cvs.height);
    if (code) {
      stream.getTracks().forEach(t => t.stop());
      vid.hidden = true;
      onFound(code.data);
    } else requestAnimationFrame(loop);
  };
  loop();
}