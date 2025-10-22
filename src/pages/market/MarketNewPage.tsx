import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "@/lib/firebase";
import {
  collection, doc, serverTimestamp, setDoc
} from "firebase/firestore";
import {
  ref, uploadBytes, getDownloadURL
} from "firebase/storage";

/**
 * 상품 등록 (3종 세트 버전)
 * - 입력 검증
 * - 제출 잠금
 * - 이미지 미리보기
 */
type Category = "축구화" | "유니폼" | "공" | "기타";
type Status = "selling" | "reserved" | "sold";

const CATEGORIES: Category[] = ["축구화", "유니폼", "공", "기타"];
const STATUSES: { label: string; value: Status }[] = [
  { label: "판매중", value: "selling" },
  { label: "예약중", value: "reserved" },
  { label: "판매완료", value: "sold" },
];

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export default function MarketNewPage() {
  const nav = useNavigate();
  const user = auth.currentUser;

  const [title, setTitle] = useState("");
  const [priceText, setPriceText] = useState(""); // 콤마 포함 표시용
  const price = useMemo(
    () => Number((priceText || "").replace(/[^\d]/g, "")),
    [priceText]
  );
  const [category, setCategory] = useState<Category>("기타");
  const [status, setStatus] = useState<Status>("selling");
  const [dongCode, setDongCode] = useState("KR-41411560"); // 기본값 예시
  const [desc, setDesc] = useState("");
  const [published, setPublished] = useState(true);

  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false); // 제출 잠금

  // 파일 미리보기 URL 정리
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.url));
    };
  }, [files]);

  function formatPriceInput(v: string) {
    const num = (v || "").replace(/[^\d]/g, "");
    if (!num) return setPriceText("");
    // 천단위 콤마
    setPriceText(num.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const filtered = picked.filter((f) => {
      if (!f.type.startsWith("image/")) return false;
      if (f.size > MAX_IMAGE_SIZE) return false;
      return true;
    });

    const previews = filtered.slice(0, MAX_IMAGES - files.length).map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));

    if (previews.length) {
      setFiles((prev) => [...prev, ...previews]);
    }

    // 선택 초기화(같은 파일 다시 선택 가능)
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFileAt(i: number) {
    setFiles((prev) => {
      const target = prev[i];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  // 간단한 동코드 검증: KR-숫자8자리 || 한글 동이름
  function isValidDongCode(v: string) {
    return /^KR-\d{8}$/.test(v) || /^[가-힣0-9\s\-]+$/.test(v);
  }

  function validate() {
    const next: Record<string, string> = {};

    if ((title || "").trim().length < 2) next.title = "제목은 최소 2자 이상 입력하세요.";
    if ((title || "").length > 100) next.title = "제목은 100자 이내로 입력하세요.";

    if (!price || price < 1) next.price = "유효한 가격을 입력하세요(1원 이상).";

    if (!CATEGORIES.includes(category))
      next.category = "카테고리를 선택하세요.";

    if (!STATUSES.find((s) => s.value === status))
      next.status = "상태를 선택하세요.";

    if (!isValidDongCode(dongCode)) next.dongCode = "동 코드 형식이 올바르지 않습니다.";

    if ((desc || "").length > 1000) next.desc = "설명은 1,000자 이내로 입력하세요.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return; // 제출 잠금
    if (!validate()) return;

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    setBusy(true);
    try {
      // 문서ID 먼저 확보
      const docRef = doc(collection(db, "market"));

      // 이미지 업로드 (선택)
      const imageUrls: string[] = [];
      if (files.length) {
        for (const f of files) {
          const path = `marketImages/${user.uid}/${docRef.id}/${Date.now()}_${f.file.name}`;
          const r = ref(storage, path);
          await uploadBytes(r, f.file);
          const url = await getDownloadURL(r);
          imageUrls.push(url);
        }
      }

      await setDoc(docRef, {
        title: title.trim(),
        price,
        category,
        status,
        published,
        dongCode: dongCode.trim(),
        district: "송산2동",
        desc: (desc || "").trim(),
        images: imageUrls,
        sellerUid: user.uid,
        createdAt: serverTimestamp(),
      });

      console.log("등록 완료:", docRef.id);
      alert("등록이 완료되었습니다.");
      nav(`/market/${docRef.id}`, { replace: true });
    } catch (err: any) {
      console.error(err);
      alert("등록에 실패했습니다: " + (err?.message ?? "알 수 없는 오류"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-screen-sm p-4">
      <button onClick={() => nav(-1)} className="mb-3">← 뒤로</button>
      <form onSubmit={onSubmit} className="space-y-4">
        <h1 className="text-xl font-semibold">상품 등록</h1>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium mb-1">제목</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 나이키 머큐리얼 260"
          />
          {errors.title && (
            <p className="mt-1 text-red-600 text-sm">{errors.title}</p>
          )}
        </div>

        {/* 가격 */}
        <div>
          <label className="block text-sm font-medium mb-1">가격(원)</label>
          <input
            className="w-full rounded border px-3 py-2"
            inputMode="numeric"
            value={priceText}
            onChange={(e) => formatPriceInput(e.target.value)}
            placeholder="예) 12,000"
          />
          {errors.price && (
            <p className="mt-1 text-red-600 text-sm">{errors.price}</p>
          )}
        </div>

        {/* 카테고리 & 상태 */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">카테고리</label>
            <select
              className="w-full rounded border px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-red-600 text-sm">{errors.category}</p>
            )}
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">상태</label>
            <select
              className="w-full rounded border px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-red-600 text-sm">{errors.status}</p>
            )}
          </div>
        </div>

        {/* 동코드 */}
        <div>
          <label className="block text-sm font-medium mb-1">동 코드</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={dongCode}
            onChange={(e) => setDongCode(e.target.value)}
            placeholder="예) KR-41411560 또는 송산2동"
          />
          {errors.dongCode && (
            <p className="mt-1 text-red-600 text-sm">{errors.dongCode}</p>
          )}
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium mb-1">설명</label>
          <textarea
            className="w-full rounded border px-3 py-2 h-36"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="상품 상태, 사용 기간, 교환/에누리 가능 여부 등을 적어주세요."
          />
          {errors.desc && (
            <p className="mt-1 text-red-600 text-sm">{errors.desc}</p>
          )}
        </div>

        {/* 이미지 업로드(미리보기) */}
        <div>
          <label className="block text-sm font-medium mb-1">이미지</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onPickFiles}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            이미지 {files.length} / {MAX_IMAGES} (장당 5MB 이하)
          </p>

          {files.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {files.map((f, i) => (
                <div key={i} className="relative">
                  <img
                    src={f.url}
                    alt={`preview-${i}`}
                    className="h-24 w-24 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removeFileAt(i)}
                    className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6 text-xs"
                    aria-label="미리보기 삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 공개 여부 */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          <span>공개(published)</span>
        </label>

        {/* 제출 */}
        <button
          type="submit"
          disabled={busy}
          className={`w-full py-3 rounded text-white ${
            busy ? "bg-gray-400" : "bg-black hover:bg-neutral-800"
          }`}
        >
          {busy ? "등록 중..." : "등록하기"}
        </button>
      </form>
    </div>
  );
}