import { useEffect, useRef, useState } from "react";

export default function ProductCaptureModal({ onClose, onCaptured }: { onClose: () => void; onCaptured?: (blob: Blob) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    (async () => {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    })();
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  function shoot() {
    const video = videoRef.current!;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!; ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => { if (blob) onCaptured?.(blob); }, "image/jpeg", 0.9);
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 w-full space-y-3">
      <h2 className="text-lg font-semibold">상품 촬영</h2>
      <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl bg-black" />
      <div className="flex gap-2 justify-end">
        <button className="px-3 py-1.5 rounded-xl border" onClick={onClose}>닫기</button>
        <button className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white" onClick={shoot}>촬영</button>
      </div>
    </div>
  );
} 