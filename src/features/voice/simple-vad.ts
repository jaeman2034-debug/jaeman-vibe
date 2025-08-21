// simple-vad.ts
export async function startSimpleVAD(opts?: {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onRms?: (rms: number, dbfs: number) => void;
  onReady?: (info: { noise: number; start: number; stop: number }) => void; // ★ 추가
}) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: false,
    },
  });

  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048; // 2048 샘플(≈43ms@48kHz)
  src.connect(analyser);

  const buf = new Float32Array(analyser.fftSize);

  const rms = () => {
    analyser.getFloatTimeDomainData(buf);
    let s = 0;
    for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
    return Math.sqrt(s / buf.length);
  };

  const toDb = (x: number) => (x > 0 ? 20 * Math.log10(x) : -Infinity);

  // --- 1) 1초 간 노이즈 바닥 캘리브레이션 (간단 이동평균)
  let noise = 0;
  const alpha = 0.2; // EMA 계수
  const calibrateUntil = performance.now() + 1000;
  while (performance.now() < calibrateUntil) {
    const r = rms();
    noise = noise ? alpha * r + (1 - alpha) * noise : r;
    await new Promise(r => requestAnimationFrame(() => r(null)));
  }

  // 임계치 설정: +12dB / +6dB
  const startThreshold = noise * 4;
  const stopThreshold = noise * 2;

  console.log(`[VAD] noise_floor=${noise.toFixed(4)} start=${startThreshold.toFixed(4)} stop=${stopThreshold.toFixed(4)}`);

  // 임계치 계산 후에 아래 한 줄 추가
  opts?.onReady?.({ noise, start: startThreshold, stop: stopThreshold }); // ★ 추가

  // --- 2) 런타임 VAD (히스테리시스 + 행오버)
  let talking = false;
  let ema = noise;
  const hangoverMs = 200;
  const frameMs = (analyser.fftSize / ctx.sampleRate) * 1000; // ≈43ms
  let silenceMs = 0;

  const loop = () => {
    const r = rms();
    ema = alpha * r + (1 - alpha) * ema; // 약간 부드럽게
    opts?.onRms?.(ema, toDb(ema));

    if (!talking) {
      if (ema >= startThreshold) {
        talking = true;
        silenceMs = 0;
        opts?.onSpeechStart?.();
        console.log("🎤 speech start");
      }
    } else {
      if (ema < stopThreshold) {
        silenceMs += frameMs;
        if (silenceMs >= hangoverMs) {
          talking = false;
          silenceMs = 0;
          opts?.onSpeechEnd?.();
          console.log("🛑 speech end");
        }
      } else {
        silenceMs = 0; // 소리가 다시 커졌으면 리셋
      }
    }

    requestAnimationFrame(loop);
  };

  loop();

  return {
    stream,
    stop: () => {
      stream.getTracks().forEach(t => t.stop());
      ctx.close();
    },
  };
} 