import React, { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase"; // 단일 진입점 사용
import { useToast } from "@/components/common/Toast";

type BaseProps = {
  open: boolean;
  onClose: () => void;
  cat: string;           // categoryKey / sportKey
  region: string;        // KR/JP/US...
  tab: "market" | "clubs" | "jobs" | "events";
};

type Field = { name: string; label: string; type?: "text"|"number"|"select"|"datetime"; required?: boolean; options?: {label:string; value:string}[] };

// 간단한 헬퍼 추출
type Errors = Record<string, string | undefined>;

function validate(tab: BaseProps["tab"], form: Record<string, any>) : Errors {
  const e: Errors = {};
  const req = (name: string, label: string) => {
    if (!form[name] && form[name] !== 0) e[name] = `'${label}'은(는) 필수 입력입니다.`;
  };
  const pos = (name: string, label: string) => {
    if (form[name] !== "" && form[name] != null && Number(form[name]) < 0) {
      e[name] = `'${label}'은(는) 0 이상이어야 합니다.`;
    }
  };

  if (tab === "market") {
    req("title","상품명");
    pos("price","가격");
  }
  if (tab === "clubs") {
    req("title","모임/클럽명");
    if (form.memberCount != null && Number(form.memberCount) < 1) {
      e["memberCount"] = "회원수는 1명 이상이어야 합니다.";
    }
  }
  if (tab === "jobs") {
    req("title","공고 제목");
    req("role","직무");
  }
  if (tab === "events") {
    req("title","이벤트명");
    req("type","종류");
    req("startAt","시작 시간");
  }
  return e;
}

const FIELDS: Record<BaseProps["tab"], Field[]> = {
  market: [
    { name: "title", label: "상품명", required: true },
    { name: "price", label: "가격(원)", type: "number" },
    { name: "thumbnailUrl", label: "썸네일 이미지 URL" },
  ],
  clubs: [
    { name: "title", label: "모임/클럽명", required: true },
    { name: "memberCount", label: "현재 회원(명)", type: "number" },
    { name: "description", label: "소개" },
  ],
  jobs: [
    { name: "title", label: "공고 제목", required: true },
    { name: "role", label: "직무", type: "select", options: [
      { label: "코치", value: "coach" },
      { label: "트레이너", value: "trainer" },
      { label: "스태프", value: "staff" },
      { label: "심판", value: "referee" },
    ], required: true },
    { name: "description", label: "상세" },
  ],
  events: [
    { name: "title", label: "이벤트/레슨 제목", required: true },
    { name: "type", label: "종류", type: "select", options: [
      { label: "경기", value: "match" },
      { label: "레슨", value: "lesson" },
      { label: "훈련", value: "training" },
    ], required: true },
    { name: "startAt", label: "시작 시간", type: "datetime", required: true },
    { name: "venue", label: "장소/코트" },
  ],
};

export default function CreateModal({ open, onClose, cat, region, tab }: BaseProps) {
  const toast = useToast();

  const fields = FIELDS[tab];
  const [form, setForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  const colPath = useMemo(() => {
    switch (tab) {
      case "market": return "products";
      case "clubs":  return "clubs";
      case "jobs":   return "jobs";
      case "events": return "events";
    }
  }, [tab]);

  if (!open) return null;

  // onChange 핸들러 지연
  const onChange = (name: string, v: any) => {
    setForm(prev => ({ ...prev, [name]: v }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setErrors({});

    // 유효성 검사
    const ve = validate(tab, form);
    setErrors(ve);
    if (Object.values(ve).some(Boolean)) {
      setErr("입력값을 확인해주세요.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setErr("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    try {
      // 공통 메타
      const common: any = {
        region,
        createdAt: serverTimestamp(),
      };

      let payload: any = {};
      if (tab === "market") {
        payload = {
          ...common,
          title: form.title,
          price: form.price ? Number(form.price) : null,
          thumbnailUrl: form.thumbnailUrl || null,
          categoryKey: cat,
          ownerUid: user.uid,
        };
      } else if (tab === "clubs") {
        payload = {
          ...common,
          title: form.title,
          memberCount: form.memberCount ? Number(form.memberCount) : 1,
          description: form.description || null,
          sportKey: cat,
          adminUids: [user.uid],
        };
      } else if (tab === "jobs") {
        payload = {
          ...common,
          title: form.title,
          role: form.role,
          description: form.description || null,
          sportKey: cat,
          ownerUid: user.uid,
        };
      } else if (tab === "events") {
        payload = {
          ...common,
          title: form.title,
          type: form.type,
          startAt: new Date(form.startAt),
          venue: form.venue || null,
          sportKey: cat,
          hostUid: user.uid,
        };
      }

      await addDoc(collection(db, colPath), payload);
      toast("등록되었습니다.");
      setForm({});
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error: any) {
      console.error("Create error:", error);
      setErr(error.message || "등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {tab === "market" && "상품 등록"}
              {tab === "clubs" && "모임 생성"}
              {tab === "jobs" && "구인·구직 공고"}
              {tab === "events" && "이벤트 등록"}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(f => (
              <div key={f.name} className="space-y-1">
                <label className="text-sm">
                  {f.label}{f.required && <span className="text-red-500"> *</span>}
                </label>
                
                {f.type === "select" ? (
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    value={form[f.name] || ""}
                    onChange={(e) => onChange(f.name, e.target.value)}
                  >
                    <option value="">선택해주세요</option>
                    {f.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : f.type === "number" ? (
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    placeholder={f.label}
                    value={form[f.name] || ""}
                    onChange={(e) => onChange(f.name, e.target.value)}
                  />
                ) : f.type === "datetime" ? (
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    value={form[f.name] || ""}
                    onChange={(e) => onChange(f.name, e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    placeholder={f.label}
                    value={form[f.name] || ""}
                    onChange={(e) => onChange(f.name, e.target.value)}
                  />
                )}
                
                {errors[f.name] && <div className="text-xs text-red-600">{errors[f.name]}</div>}
              </div>
            ))}

            {err && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {err}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                취소
              </button>
              <button 
                disabled={loading} 
                type="submit" 
                className={"flex-1 px-3 py-2 rounded-xl border bg-black text-white " + (loading ? "opacity-70 cursor-not-allowed" : "")}
              >
                {loading ? "등록 중..." : "등록"}
              </button>
            </div>
          </form>
        </div>
      </div>
      

    </>
  );
}