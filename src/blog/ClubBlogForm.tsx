import { addDoc, updateDoc, doc, collection, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { extractTitleFromContent, makeExcerpt, findFirstImageUrl } from '@/utils/title';
import { refineKoTitle, smartComposeKoTitle, smartKoTitle } from '@/utils/title-ko';
import AIGenerateButtons from './AIGenerateButtons';
import AIMediaGenerateButtons from './AIMediaGenerateButtons';
import NaverCrossPost from './NaverCrossPost';
import MediaUploader from './MediaUploader';

export default function ClubBlogForm() {
  const { clubId, postId } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const isEdit = !!postId;

  // 1) clubId 가드
  useEffect(() => {
    if (!clubId || clubId === 'select') {
      const go = new URLSearchParams(location.search).get('go') || 'blog/new';
      nav(`/clubs/select?go=${go}`, { replace: true });
    }
  }, [clubId, nav, location]);

  // 2) 새 글일 때 사용할 "미리 생성한 문서 ID"
  const [draftId, setDraftId] = useState<string | null>(null);
  useEffect(() => {
    if (!isEdit && clubId) {
      const ref = doc(collection(db, 'clubs', clubId, 'blog')); // 아직 쓰지 않지만 id만 확보
      setDraftId(ref.id);
    }
  }, [isEdit, clubId]);

  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false); // 사용자가 제목을 손으로 바꿨는지
  const [content, setContent] = useState('');
  const [contentTouched, setContentTouched] = useState(false); // 사용자가 본문을 손으로 바꿨는지
  const [published, setPublished] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [memo, setMemo] = useState(''); // 상단 메모 박스
  const [autoExtract, setAutoExtract] = useState(true); // 라이브 자동발췌 ON/OFF
  const [saving, setSaving] = useState(false);

  // ✅ 메모 타이핑 → (디바운스) 제목/본문 자동 반영
  useEffect(() => {
    if (!autoExtract) return;
    const t = setTimeout(() => {
      if (!titleTouched) {
        const subjectOnlyTitle = smartKoTitle(memo, { subjectOnly: true });
        setTitle(subjectOnlyTitle);
      }
      if (!contentTouched) {
        setContent(memo);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [memo, autoExtract, titleTouched, contentTouched]);

  const excerpt = useMemo(() => makeExcerpt(content), [content]);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const s = await getDoc(doc(db, `clubs/${clubId}/blog/${postId}`));
      const d: any = s.data() || {};
      setTitle(d.title || '');
      setTitleTouched(!!d.title); // 기존 글이면 제목이 이미 있으므로 touched로 설정
      setContent(d.content || '');
      setPublished(!!d.published);
      setPinned(!!d.pinned);
    })();
  }, [clubId, postId, isEdit]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) { alert('로그인이 필요합니다.'); return; }
      if (!clubId) { alert('클럽 ID가 없습니다.'); return; }

      if (isEdit && postId) {
        // 수정 시에도 안전장치 적용 (팀명만으로 간단하게)
        const finalTitle = title?.trim() || smartKoTitle(content || memo, { subjectOnly: true });
        const safeTitle = finalTitle;
        const safeContent = content || memo;
        const hero = findFirstImageUrl(safeContent);
        
        await updateDoc(doc(db, 'clubs', clubId, 'blog', postId), {
          title: safeTitle, 
          content: safeContent, 
          published, 
          pinned,
          excerpt: makeExcerpt(safeContent),
          heroCover: hero,
          updatedAt: serverTimestamp(),
        });
        alert('수정되었습니다!');
      } else {
        // 새 글: draftId가 없으면 안전막
        if (!draftId) {
          alert('초기화 중입니다. 잠시 후 다시 시도해 주세요.');
          return;
        }

        // 1) setDoc으로 "미리 정한 ID"에 저장
        const postRef = doc(db, 'clubs', clubId, 'blog', draftId);
        
        // 발행 시 안전장치 (마지막 방어선) - 팀명만으로 간단하게
        const finalTitle = title?.trim() || smartKoTitle(content || memo, { subjectOnly: true });
        const safeTitle = finalTitle;
        const safeContent = content || memo;
        const hero = findFirstImageUrl(safeContent);
        
        await setDoc(postRef, {
          clubId, 
          title: safeTitle,
          content: safeContent,
          excerpt: makeExcerpt(safeContent),
          heroCover: hero ?? null,
          authorUid: uid,
          published,           // ← 체크박스 값 반영
          pinned,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });

        // 2) 블로그 홈 갱신
        await setDoc(
          doc(db, 'clubs', clubId, 'pages', 'blogHome'),
          {
            title: '클럽 블로그',
            intro: '새로운 글이 발행되었습니다.',
            latestPostId: postRef.id,
            latestPostTitle: safeTitle,
            heroCover: hero ?? null,                      // ← 홈 커버도 자동 설정
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        // 3) 클럽 상태 플래그
        await updateDoc(doc(db, 'clubs', clubId), {
          hasBlog: true,
          blogHomeUpdatedAt: serverTimestamp(),
        });

        alert('글이 발행되었습니다!');
      }

      nav(`/clubs/${clubId}/blog`, { replace: true });
    } catch (err: any) {
      console.error(err);
      alert(`저장 중 오류: ${err?.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  // AI → 본문 채우기
  const handleAIFill = ({ title, content }: { title: string; content: string }) => {
    setTitle(title);
    setContent(content);
  };

  // 업로드 성공 시 본문에 삽입
  const handleMediaUpload = (url: string, type: 'image' | 'video', fileName: string) => {
    const insertText = type === 'image'
      ? `![${fileName}](${url})\n`
      : `<video controls src="${url}"></video>\n`;
    setContent(prev => `${prev}\n${insertText}`);
  };

  const handleUploadError = (error: string) => alert(`업로드 오류: ${error}`);

  // 본문/제목을 손으로 만지면 더 이상 자동 갱신하지 않음
  const onChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleTouched(true);
    setTitle(e.target.value);
  };
  const onChangeContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContentTouched(true);
    setContent(e.target.value);
  };

  // 🔸 업로드가 "실제 포스트 ID" 위치로 가도록 postId 결정
  const targetPostIdForUpload = isEdit ? (postId as string) : (draftId ?? 'pending');

  return (
    <div className="mx-auto max-w-3xl p-4">
      {/* 헤더바: 좌 제목 미리보기, 우 발행 */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500 line-clamp-1">
          미리보기: {title || "제목을 입력하세요"}
        </div>
        <div className="flex items-center gap-2">
          {/* 팀명만 제목 버튼 */}
          <button
            type="button"
            onClick={() => {
              setTitleTouched(false);
              setTitle(smartKoTitle(memo, { subjectOnly: true }));
            }}
            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
            title="팀명만 간단하게 제목으로 사용"
          >
            📝 팀명만
          </button>
          {/* 상세 제목 생성 버튼 */}
          <button
            type="button"
            onClick={() => {
              const fullTitle = smartKoTitle(memo || content, { subjectOnly: false });
              setTitle(fullTitle);
              setTitleTouched(true); // 수동으로 생성했으므로 touched로 설정
            }}
            className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100"
            title="팀명 + 창단년도 + 운동장 정보로 상세 제목 생성"
          >
            🧠 상세
          </button>
          {/* "다시 자동" 버튼 (수동 재발췌) */}
          <button
            type="button"
            onClick={() => {
              setTitleTouched(false);
              setContentTouched(false);
              setTitle(smartKoTitle(memo, { subjectOnly: true }));
              setContent(memo);
            }}
            className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
            title="메모에서 제목/본문 다시 자동 생성"
          >
            🔄 다시 자동
          </button>
          <button
            type="submit"
            form="post-form"
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50 hover:bg-blue-700"
          >
            {saving ? "발행 중…" : (isEdit ? "수정하기" : "발행하기")}
          </button>
        </div>
      </div>

      {/* 상단 메모 → 여기다 쓰면 제목/본문 자동 반영 */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-600">메모: 여기에 적으면 제목/본문이 자동 구성됩니다.</label>
          <label className="text-xs flex items-center gap-1">
            <input type="checkbox" checked={autoExtract} onChange={e=>setAutoExtract(e.target.checked)} />
            자동 발췌
          </label>
        </div>
        <textarea
          value={memo}
          onChange={(e)=>setMemo(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded border p-2"
          placeholder="예) 60대 FC 신규모집, 토 오전 8~11시 소흘 체육공원, 회비 월 2만 원, 연락처..."
        />
      </div>

      {/* 1) 제목/본문 – 사용자가 수정하면 자동반영 멈춤 */}
      <input
        value={title}
        onChange={onChangeTitle}
        placeholder="제목을 입력하세요"
        className="w-full border-b-2 border-gray-200 px-1 pb-2 text-2xl font-bold outline-none focus:border-blue-500 mb-4"
      />
      <textarea
        value={content}
        onChange={onChangeContent}
        rows={12}
        className="mt-3 w-full rounded border p-3 text-base leading-relaxed"
        placeholder="내용을 입력하세요…"
      />

      {/* 3) 미디어(간단) */}
      <div className="mt-6">
        <h3 className="mb-2 font-medium">📷 이미지/영상</h3>
        <MediaUploader
          clubId={clubId!}
          postId={targetPostIdForUpload}
          onUploadComplete={(url, type, name) => {
            const insert = type === "image"
              ? `![${name}](${url})`
              : `<video controls src="${url}"></video>`;
            setContent((p) => `${p}\n${insert}\n`);
          }}
          onError={(e) => alert(`업로드 오류: ${e}`)}
        />
      </div>

      {/* 4) 옵션—접기 */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">⚙️ 자세히</summary>
        <div className="mt-3 space-y-4">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={published} onChange={(e)=>setPublished(e.target.checked)} />
              공개
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={pinned} onChange={(e)=>setPinned(e.target.checked)} />
              상단 고정
            </label>
          </div>
          <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
            <strong>요약:</strong> {excerpt}
          </div>
          
          {/* AI 작성 섹션 (새 글일 때만) */}
          {!isEdit && (
            <div className="space-y-3 border-t pt-4">
              <div className="text-sm font-medium text-gray-700">🤖 AI 도우미</div>
              <AIGenerateButtons clubId={clubId!} memo={memo} setMemo={setMemo} onFill={handleAIFill} />
              <AIMediaGenerateButtons clubId={clubId!} memo={memo} setMemo={setMemo} onFill={handleAIFill} />
            </div>
          )}
          
          {/* 네이버 크로스포스트 (수정 시에만) */}
          {isEdit && postId && (
            <div className="border-t pt-4">
              <div className="text-sm font-medium text-gray-700 mb-3">📤 네이버 블로그 연동</div>
              <NaverCrossPost clubId={clubId!} postId={postId} />
            </div>
          )}
        </div>
      </details>

      {/* 폼 – 버튼은 헤더에서 form=post-form 로 submit */}
      <form id="post-form" onSubmit={onSubmit} className="hidden" />
    </div>
  );
}
