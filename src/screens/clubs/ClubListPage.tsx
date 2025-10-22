import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getFirestore, collection, query, where, getDocs,
  doc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { createClubWithScaffold } from "../../utils/createClubWithScaffold";
import { getAuth } from "firebase/auth";

type Club = { id: string; name?: string; subtitle?: string; active?: boolean };

export default function ClubListPage() {
  const db = getFirestore();
  const nav = useNavigate();
  const { search } = useLocation();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // URL ↔ 상태 동기화
  const showTrash = useMemo(
    () => new URLSearchParams(search).get("trash") === "1",
    [search]
  );

  const toggleTrash = useCallback(() => {
    const sp = new URLSearchParams(search);
    showTrash ? sp.delete("trash") : sp.set("trash", "1");
    nav({ search: `?${sp.toString()}` }, { replace: true });
  }, [search, showTrash, nav]);

  // 파일 추적 로그(정상 파일 맞는지)
  useEffect(() => {
    (window as any).__CLUBS_FILE__ = import.meta.url;
    console.log("[Clubs] MOUNT from:", import.meta.url);
  }, []);

  // 목록 로드 (언마운트/경합 안전)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const q = query(collection(db, "clubs"), where("active", "==", !showTrash));
        const snap = await getDocs(q);
        if (!alive) return;
        setClubs(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [db, showTrash]);

  // 삭제/복원
  const softDelete = useCallback(async (id: string) => {
    if (!confirm("이 클럽을 삭제할까요? (휴지통으로 이동)")) return;
    setBusyId(id);
    try {
      await updateDoc(doc(db, "clubs", id), {
        active: false,
        deletedAt: serverTimestamp(),
      });
      setClubs(v => v.filter(c => c.id !== id));
    } finally {
      setBusyId(null);
    }
  }, [db]);

  const restore = useCallback(async (id: string) => {
    setBusyId(id);
    try {
      await updateDoc(doc(db, "clubs", id), {
        active: true,
        restoredAt: serverTimestamp(),
      });
      setClubs(v => v.filter(c => c.id !== id));
    } finally {
      setBusyId(null);
    }
  }, [db]);

  // ▶ 새 클럽 만들고(활성) 팀/블로그 자동 세팅까지
  const handleCreateAuto = async () => {
    const name = prompt("새 클럽 이름을 입력하세요", "소흘 6060");
    if (!name) return;

    const { currentUser } = getAuth();
    if (!currentUser) return alert("로그인이 필요합니다.");

    try {
      console.log("[Clubs] create-auto clicked");
      const id = await createClubWithScaffold(currentUser.uid, name.trim());
      console.log("created:", id);
      alert("클럽과 기본 팀/블로그가 생성되었습니다!");
      
      // 목록 즉시 리프레시
      setClubs((prev) => [{ id, name, subtitle: `${name} 공식 클럽`, active: true }, ...prev]);
      // 바로 블로그로 이동
      nav(`/clubs/${id}/blog`);
    } catch (e: any) {
      console.error("[Clubs] error:", e);
      alert(`생성 중 오류: ${e.message ?? e}`);
    }
  };

  return (
    <div className="p-4">
      {/* 헤더: 휴지통 토글 옆에 '새 클럽+자동 세팅' 추가 */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">클럽</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleTrash}
            className="px-3 py-1.5 border rounded text-sm"
          >
            {showTrash ? "활성 목록 보기" : "휴지통 보기"}
          </button>
          <button
            type="button"
            onClick={handleCreateAuto}
            className="px-3 py-1.5 border rounded text-sm bg-black text-white"
          >
            새 클럽+자동 세팅
          </button>
        </div>
      </div>

      {/* 클럽 목록 */}
      <div className="mt-4 space-y-3">
        {loading && <div className="text-sm text-gray-500">불러오는 중…</div>}
        {err && <div className="text-sm text-red-600">불러오기 오류: {err}</div>}
        {!loading && !err && clubs.length === 0 && (
          <div className="text-sm text-gray-500">
            {showTrash ? "휴지통이 비었습니다." : (
              <>
                클럽이 없습니다.{" "}
                <button
                  onClick={handleCreateAuto}
                  className="ml-2 underline"
                >
                  새 클럽+자동 세팅
                </button>
                을 눌러 시작하세요.
              </>
            )}
          </div>
        )}

        {clubs.map(c => (
          <div key={c.id} className="border rounded p-3 flex items-center justify-between">
            <div className="min-w-0">
              <div className="font-semibold truncate">{c.name ?? c.id}</div>
              {c.subtitle && <div className="text-sm text-gray-500 truncate">{c.subtitle}</div>}
            </div>

            {showTrash ? (
              <button
                className="px-2 py-1 border rounded"
                disabled={busyId === c.id}
                onClick={() => restore(c.id)}
              >
                {busyId === c.id ? "복원중…" : "복원"}
              </button>
            ) : (
              <button
                className="px-2 py-1 border rounded text-red-600"
                disabled={busyId === c.id}
                onClick={() => softDelete(c.id)}
              >
                {busyId === c.id ? "삭제중…" : "삭제"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 상단-오른쪽 고정 토글(항상 표시) */}
      <button
        type="button"
        onClick={toggleTrash}
        className="fixed top-4 right-4 z-[2147483647] px-4 py-2 rounded-md border shadow bg-white"
        aria-label="휴지통 토글(고정)"
      >
        {showTrash ? "활성 목록 보기" : "휴지통 보기"}
      </button>

      {/* 우하단 FAB (모바일만) */}
      <button
        type="button"
        onClick={toggleTrash}
        className="fixed bottom-4 right-4 px-4 py-2 rounded-full border shadow bg-white z-[2147483647] md:hidden"
        aria-label="휴지통 토글"
      >
        {showTrash ? "활성 보기" : "휴지통"}
      </button>
    </div>
  );
}
