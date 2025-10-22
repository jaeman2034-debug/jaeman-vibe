import React, { useEffect, useRef, useState } from "react";

type Props = {
  label?: string;
  onFileSelected?: (file: File | null) => void; // 부모에서 업로드에 사용
};

export default function ProductThumbPicker({ label = "썸네일", onFileSelected }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[THUMB] onChange triggered in ProductThumbPicker");
    const f = e.target.files?.[0] ?? null;
    console.log("[THUMB] selected file:", f);
    
    setFile(f);
    onFileSelected?.(f);

    // 기존 URL 정리
    if (objectUrlRef.current) {
      console.log("[THUMB] revoking previous URL:", objectUrlRef.current);
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (f) {
      const url = URL.createObjectURL(f);
      objectUrlRef.current = url;
      setPreview(url);
      console.log("[THUMB] file:", f.name, f.type, f.size, "preview:", url);
    } else {
      console.log("[THUMB] no file selected, clearing preview");
      setPreview(null);
    }
  };

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  return (
    <div className="space-y-2">
      <label className="block font-medium">{label}</label>
      <input 
        type="file" 
        accept="image/*" 
        onChange={onChange}
        className="w-full p-2 border rounded"
      />
      {preview ? (
        <img
          src={preview}
          alt="미리보기"
          style={{
            width: 180,
            height: 180,
            objectFit: "cover",
            borderRadius: 8,
            border: "1px solid #ddd",
            display: "block",
          }}
          onLoad={() => console.log("[THUMB] preview loaded successfully")}
          onError={(e) => {
            console.warn("[THUMB] preview load error");
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <p className="text-sm text-gray-500">이미지를 선택하면 즉시 미리보기가 표시됩니다.</p>
      )}
    </div>
  );
}
