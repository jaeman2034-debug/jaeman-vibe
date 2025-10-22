import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc, updateDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';

interface FileItem {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
}

export default function EventCreate() {
  // React Router 컨텍스트가 제대로 설정되지 않은 경우를 대비한 안전장치
  let nav: any;
  try {
    nav = useNavigate();
  } catch (error) {
    console.error('useNavigate error:', error);
    nav = (path: string) => {
      console.log('Fallback navigation to:', path);
      window.location.href = path;
    };
  }
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);

  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('축구');
  const [capacity, setCapacity] = useState('12');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [fee, setFee] = useState('0');
  const [dongCode, setDongCode] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [description, setDescription] = useState('');

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files || []);
    const newFiles: FileItem[] = fileList.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) URL.revokeObjectURL(file.previewUrl);
      return prev.filter(f => f.id !== id);
    });
  };

  const totalProgress = files.length > 0 ? Math.round(files.reduce((sum, f) => sum + f.progress, 0) / files.length) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const user = auth.currentUser;
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setSubmitting(true);

    try {
      // 1) 문서 먼저 생성
      const docRef = await addDoc(collection(db, 'events'), {
        title: title.trim(),
        sport,
        capacity: parseInt(capacity),
        startAt: start ? new Date(start) : null,
        endAt: end ? new Date(end) : null,
        fee: parseInt(fee) || 0,
        dongCode: dongCode.trim() || null,
        placeName: placeName.trim() || null,
        description: description.trim(),
        images: [],
        status: 'open',
        hostId: user.uid,
        attendeeCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2) 파일 업로드
      const uploadedUrls: string[] = [];
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          
          try {
            const path = `events/${user.uid}/${docRef.id}/${i}-${Date.now()}-${fileItem.file.name}`;
            const storageRef = ref(storage, path);
            const uploadTask = uploadBytesResumable(storageRef, fileItem.file);

            const url = await new Promise<string>((resolve, reject) => {
              uploadTask.on('state_changed',
                (snapshot) => {
                  const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                  setFiles(prev => prev.map(f => 
                    f.id === fileItem.id ? { ...f, progress } : f
                  ));
                },
                reject,
                async () => {
                  const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                  resolve(downloadUrl);
                }
              );
            });

            uploadedUrls.push(url);
            
            // 완료 상태 업데이트
            setFiles(prev => prev.map(f => 
              f.id === fileItem.id ? { ...f, progress: 100 } : f
            ));

          } catch (error) {
            console.error('Upload failed:', error);
          }
        }
      }

      // 3) 이미지 URL 반영
      if (uploadedUrls.length > 0) {
        await updateDoc(docRef, {
          images: uploadedUrls,
          updatedAt: serverTimestamp(),
        });
      }

      // 4) 호스트 역할 부여
      await setDoc(doc(db, 'events', docRef.id, 'roles', user.uid), {
        role: 'host',
        grantedAt: new Date(),
        grantedBy: user.uid,
      });

      // 5) 상세 페이지로 이동
      nav(`/events/${docRef.id}`, { replace: true });

    } catch (error) {
      console.error('Error creating event:', error);
      alert('생성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3">
        <Link to="/events" className="text-sm text-blue-600 underline">← 모임</Link>
        <h1 className="text-lg font-semibold">모임 만들기</h1>
        <div className="ml-auto" />
        <button type="button" onClick={() => inputRef.current?.click()} className="text-sm underline">이미지 선택</button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
      </div>

      <form onSubmit={submit} className="mt-4 space-y-5">
        <div>
          <label className="block text-sm font-medium">제목</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border p-3" placeholder="예) 일요일 풋살 번개" required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">종목</label>
            <select value={sport} onChange={e => setSport(e.target.value)} className="mt-1 w-full rounded-xl border p-3">
              {['축구', '농구', '배드민턴', '테니스', '런닝', '기타'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">정원</label>
            <input value={capacity} onChange={e => setCapacity(e.target.value)} inputMode="numeric" className="mt-1 w-full rounded-xl border p-3" required />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">시작</label>
            <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} className="mt-1 w-full rounded-xl border p-3" required />
          </div>
          <div>
            <label className="block text-sm font-medium">종료(선택)</label>
            <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} className="mt-1 w-full rounded-xl border p-3" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">참가비(원, 선택)</label>
            <input value={fee} onChange={e => setFee(e.target.value)} inputMode="numeric" className="mt-1 w-full rounded-xl border p-3" />
          </div>
          <div>
            <label className="block text-sm font-medium">동코드(선택)</label>
            <input value={dongCode} onChange={e => setDongCode(e.target.value)} className="mt-1 w-full rounded-xl border p-3" placeholder="예) 1130563000" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">장소명(선택)</label>
          <input value={placeName} onChange={e => setPlaceName(e.target.value)} className="mt-1 w-full rounded-xl border p-3" placeholder="예) 송산풋살파크 A코트" />
        </div>

        <div>
          <label className="block text-sm font-medium">설명</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} className="mt-1 w-full rounded-xl border p-3" placeholder="모임 규칙, 준비물, 레벨 등을 적어주세요." />
        </div>

        {/* 갤러리 */}
        {files.length > 0 && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {files.map(f => (
                <div key={f.id} className="relative rounded-xl border overflow-hidden">
                  <img src={f.previewUrl} alt="preview" className="h-36 w-full object-cover" />
                  <button type="button" onClick={() => removeFile(f.id)} className="absolute right-2 top-2 bg-white/90 rounded px-2 py-1 text-xs shadow">삭제</button>
                  <div className="h-1 w-full bg-gray-100"><div className="h-1 bg-black" style={{ width: `${f.progress}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">전체 진행률 {totalProgress}%</div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Link to="/events" className="px-4 py-2 rounded-xl border">취소</Link>
          <button disabled={submitting} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60" type="submit">
            {submitting ? '생성 중...' : '생성하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
