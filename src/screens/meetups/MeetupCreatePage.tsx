import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';

export default function MeetupCreatePage() {
  const nav = useNavigate();
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [dt, setDt] = useState<string>(''); // '2025-09-05T19:00'
  const [durationMin, setDurationMin] = useState(90);
  const [placeName, setPlaceName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [capacity, setCapacity] = useState(10);
  const [fee, setFee] = useState(0);
  const [tagsRaw, setTagsRaw] = useState('');

  // 필수값 가드
  const ready = title.trim() && dt && placeName.trim();

  useEffect(() => {
    if (!currentUser) {
      nav('/auth');
      return;
    }
  }, [currentUser, nav]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert('위치 서비스를 지원하지 않습니다');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toString());
        setLng(pos.coords.longitude.toString());
      },
      () => alert('위치 권한이 필요합니다')
    );
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다');
      return;
    }

    if (!title.trim()) {
      alert('제목을 입력해주세요');
      return;
    }

    if (!dt) {
      alert('날짜와 시간을 입력해주세요');
      return;
    }

    if (!placeName.trim()) {
      alert('장소명을 입력해주세요');
      return;
    }

    setLoading(true);

    try {
      const start = new Date(dt);
      const end = new Date(start.getTime() + durationMin * 60000);
      
      const place: any = { 
        name: placeName.trim(), 
        address: address.trim() || null 
      };
      const latNum = Number(lat), lngNum = Number(lng);
      if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) { 
        place.lat = latNum; 
        place.lng = lngNum; 
      }

      const tags = tagsRaw.split(',').map(s => s.trim()).filter(Boolean);

      const docRef = await addDoc(collection(db, 'meetups'), {
        title: title.trim(),
        hostUid: currentUser.uid,
        timeStart: start,
        timeEnd: end,
        durationMin,
        place,
        capacity: Number(capacity)||0,
        fee: Number(fee)||0,
        tags,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // n8n 팬아웃(옵션)
      try{
        const hook = (import.meta as any).env.VITE_N8N_WEBHOOK_MEETUP_CREATED;
        if (hook) {
          await fetch(hook, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ meetupId: docRef.id }) });
        }
      }catch{}

      alert('모임이 생성되었습니다');
      nav('/meetups');
    }catch(e:any){
      console.error(e);
      alert('생성 실패: '+ (e.message||e));
    }finally{ setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">모임 만들기</h1>

      <div className="grid md:grid-cols-2 gap-3">
        <input className="input md:col-span-2" placeholder="제목 (예: 토요일 저녁 풋살)" value={title} onChange={e=>setTitle(e.target.value)} />

        <input className="input" type="datetime-local" step={300} value={dt} onChange={e=>setDt(e.target.value)} />

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 w-28">진행 시간</label>
          <input className="input" type="number" min={30} step={15} value={durationMin} onChange={e=>setDurationMin(Number(e.target.value))} />
          <span className="text-sm text-gray-500">분</span>
        </div>

        <input className="input md:col-span-2" placeholder="장소명" value={placeName} onChange={e=>setPlaceName(e.target.value)} />
        <input className="input md:col-span-2" placeholder="주소(선택)" value={address} onChange={e=>setAddress(e.target.value)} />

        <div className="flex gap-2">
          <input className="input" placeholder="위도(lat)" value={lat} onChange={e=>setLat(e.target.value)} />
          <input className="input" placeholder="경도(lng)" value={lng} onChange={e=>setLng(e.target.value)} />
          <button className="btn" onClick={useMyLocation}>내 위치</button>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-600 w-28">정원</label>
          <input className="input" type="number" min={1} value={capacity} onChange={e=>setCapacity(Number(e.target.value))} />
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-600 w-28">참가비(원)</label>
          <input className="input" type="number" min={0} step={500} value={fee} onChange={e=>setFee(Number(e.target.value))} />
        </div>

        <input className="input md:col-span-2" placeholder="태그(쉼표로 구분: 풋살,초급)" value={tagsRaw} onChange={e=>setTagsRaw(e.target.value)} />
      </div>

      <div className="flex gap-2">
        <button className="btn-primary" disabled={!ready || loading} onClick={handleSubmit}>{loading? '생성 중...' : '생성하기'}</button>
        <button className="btn" onClick={()=>nav('/meetups')}>취소</button>
        {title && (
          <a 
            href={`/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(tagsRaw || '')}&sport=soccer&bg=brand`} 
            target="_blank" 
            className="btn"
          >
            OG 미리보기
          </a>
        )}
      </div>
    </div>
  );
}
