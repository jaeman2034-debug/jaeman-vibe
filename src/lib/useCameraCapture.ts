import { useEffect, useRef, useState } from 'react';

type UseCamera = {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  start: () => Promise<void>;
  stop: () => void;
  takeShot: () => string | null; // dataURL 반환
  quality: number; // 0~1 (간단 품질 스코어)
};

export function useCameraCapture(): UseCamera {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [quality, setQuality] = useState(0);

  useEffect(() => () => streamRef.current?.getTracks().forEach(t => t.stop()), []);

  const start = async () => {
    streamRef.current = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } }, audio: false
    });
    if (videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      await videoRef.current.play();
    }
  };

  const stop = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const takeShot = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return null;
    const w = v.videoWidth, h = v.videoHeight;
    c.width = w; c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(v, 0, 0, w, h);

    // --- 더미 품질 스코어: 중앙 밝기/대비 간이 측정
    const cx = Math.floor(w/2), cy = Math.floor(h/2);
    const data = ctx.getImageData(cx-32, cy-32, 64, 64).data;
    let lum = 0;
    for (let i=0;i<data.length;i+=4) lum += (0.2126*data[i] + 0.7152*data[i+1] + 0.0722*data[i+2]);
    lum /= (data.length/4); // 0~255
    const score = Math.max(0, Math.min(1, (lum-40)/140)); // 40~180 사이를 0~1로
    setQuality(score);

    return c.toDataURL('image/jpeg', 0.92);
  };

  return { videoRef, canvasRef, start, stop, takeShot, quality };
} 