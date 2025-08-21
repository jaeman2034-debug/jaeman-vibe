import { useEffect, useRef, useState } from 'react';

type UseCamera = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  start: () => Promise<void>;
  stop: () => void;
  takeShot: () => string | null; // dataURL 반환
  quality: number; // 0~1 (간단 품질 스코어)
  setQuality: (score: number) => void; // 외부에서 품질 점수 설정
  getAvailableCameras: () => Promise<MediaDeviceInfo[]>; // 사용 가능한 카메라 목록
  switchCamera: (deviceId: string) => Promise<void>; // 카메라 전환
};

export function useCameraCapture(): UseCamera {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [quality, setQuality] = useState(0);

  useEffect(() => () => streamRef.current?.getTracks().forEach(t => t.stop()), []);

  // util
  async function tryGetUserMedia(constraints: MediaStreamConstraints) {
    try { return await navigator.mediaDevices.getUserMedia(constraints); }
    catch { return null; }
  }

  const start = async () => {
    // 1) 저장된 deviceId 우선
    const savedId = localStorage.getItem('cameraDeviceId') || undefined;
    let stream =
      (savedId && await tryGetUserMedia({ video: { deviceId: { exact: savedId }}, audio:false })) ||
      // 2) 후면 카메라 선호
      await tryGetUserMedia({ video: { facingMode: { ideal: 'environment' }}, audio:false }) ||
      // 3) 마지막으로 아무 비디오나
      await tryGetUserMedia({ video: true, audio: false });

    if (!stream) {
      // 더 구체적인 에러 메시지 제공
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('이 브라우저는 카메라를 지원하지 않습니다. Chrome, Firefox, Safari를 사용해주세요.');
      }
      
      // 권한 관련 에러 확인
      try {
        await navigator.permissions.query({ name: 'camera' as PermissionName });
      } catch {
        // 권한 API를 지원하지 않는 경우
      }
      
      throw new Error('카메라에 접근할 수 없습니다. 브라우저 권한과 시스템 설정을 확인해주세요.');
    }

    // 선택된 장치 id 저장
    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();
    if (settings.deviceId) localStorage.setItem('cameraDeviceId', settings.deviceId);

    const v = videoRef.current!;
    v.srcObject = stream;
    v.setAttribute('playsinline', 'true'); // iOS
    (v as any).muted = true;
    await v.play();
    streamRef.current = stream;
  };

  const getAvailableCameras = async (): Promise<MediaDeviceInfo[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'videoinput');
    } catch (error) {
      console.error('카메라 목록 조회 실패:', error);
      return [];
    }
  };

  const switchCamera = async (deviceId: string) => {
    try {
      // 기존 스트림 정지
      stop();
      
      // 새 카메라로 시작
      const stream = await tryGetUserMedia({ 
        video: { deviceId: { exact: deviceId }}, 
        audio: false 
      });
      
      if (!stream) {
        throw new Error(`선택한 카메라(${deviceId.slice(0, 8)}...)를 사용할 수 없습니다. 다른 카메라를 선택해주세요.`);
      }

      // 새 스트림 설정
      const v = videoRef.current!;
      v.srcObject = stream;
      v.setAttribute('playsinline', 'true');
      (v as any).muted = true;
      await v.play();
      
      // deviceId 저장
      localStorage.setItem('cameraDeviceId', deviceId);
      streamRef.current = stream;
      
    } catch (error) {
      console.error('카메라 전환 실패:', error);
      // 실패 시 기본 카메라로 재시도
      await start();
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

  return { videoRef, canvasRef, start, stop, takeShot, quality, setQuality, getAvailableCameras, switchCamera };
} 