import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { generatePdfFromHtml } from '../../utils/pdf';
import { uploadPdf } from '../../utils/upload';

export const ApplicationMakerPage: React.FC = () => {
  const nav = useNavigate();
  const { jobId } = useParams<{ jobId?: string }>();
  const auth = getAuth();
  const db = getFirestore();
  
  // 음성 인식 상태
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // 폼 데이터
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [locationPref, setLocationPref] = useState('');
  const [salaryPref, setSalaryPref] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [rawHighlights, setRawHighlights] = useState('');
  const [type, setType] = useState<'simple' | 'essay'>('simple');

  // 음성 인식 초기화
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ko-KR';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setPartial(prev => prev + transcript + ' ');
          } else {
            interimTranscript += transcript;
          }
        }
        if (interimTranscript) {
          setPartial(prev => prev + interimTranscript);
        }
      };

      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const start = () => {
    if (recognitionRef.current) {
      setListening(true);
      recognitionRef.current.start();
    }
  };

  const stop = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // 하이라이트 파싱
  const highlights = useMemo(() => {
    return rawHighlights
      .split(/[,\n]/)
      .map(h => h.trim())
      .filter(h => h.length > 0);
  }, [rawHighlights]);

  // 미리보기 HTML 생성
  const previewHtml = useMemo(() => {
    const title = jobId ? `지원서 - ${role}` : `지원서 초안 - ${role}`;
    
    return `
      <div style="font-family: 'Noto Sans KR', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6;">
        <h1 style="text-align: center; color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">${title}</h1>
        
        <div style="margin: 20px 0;">
          <h2 style="color: #007bff; font-size: 18px; margin-bottom: 10px;">기본 정보</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold; width: 120px;">이름</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${name || '미입력'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">연락처</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${phone || '미입력'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">이메일</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${email || '미입력'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">희망 직무</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${role || '미입력'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">희망 지역</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${locationPref || '미입력'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">희망 급여</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${salaryPref || '미입력'}</td>
            </tr>
          </table>
        </div>

        ${aboutMe ? `
          <div style="margin: 20px 0;">
            <h2 style="color: #007bff; font-size: 18px; margin-bottom: 10px;">자기소개</h2>
            <p style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 0;">${aboutMe}</p>
          </div>
        ` : ''}

        ${highlights.length > 0 ? `
          <div style="margin: 20px 0;">
            <h2 style="color: #007bff; font-size: 18px; margin-bottom: 10px;">주요 경력 및 성과</h2>
            <ul style="margin: 0; padding-left: 20px;">
              ${highlights.map(h => `<li style="margin-bottom: 8px;">${h}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${type === 'essay' ? `
          <div style="margin: 20px 0;">
            <h2 style="color: #007bff; font-size: 18px; margin-bottom: 10px;">지원 동기 및 포부</h2>
            <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 0;">
              체육 분야에서의 전문성을 바탕으로 청소년들의 성장과 발전에 기여하고 싶습니다. 
              안전하고 체계적인 교육 환경을 제공하여 학생들의 잠재력을 최대한 발휘할 수 있도록 돕겠습니다.
            </p>
          </div>
        ` : ''}

        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
          <p>생성일: ${new Date().toLocaleDateString('ko-KR')}</p>
        </div>
      </div>
    `;
  }, [name, phone, email, role, locationPref, salaryPref, aboutMe, highlights, type, jobId]);

  // PDF 생성
  const handlePdf = async () => {
    const title = jobId ? `지원서-${role}` : `지원서초안-${role}`;
    const { url } = await generatePdfFromHtml(previewHtml, `${title}.pdf`);
    return url;
  };

  // 제출 처리
  const onSubmit = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    // PDF 생성 및 업로드
    const title = jobId ? `지원서-${role}` : `지원서초안-${role}`;
    const { blob } = await generatePdfFromHtml(previewHtml, `${title}.pdf`);
    const pdfUrl = await uploadPdf(blob, `applications/${Date.now()}-${title}.pdf`);

    // Firestore에 저장
    const ref = await addDoc(collection(db, 'applications'), {
      ownerUid: currentUser.uid,
      jobId: jobId || null,
      type,
      title: jobId ? `지원서 - ${role}` : `지원서 초안 - ${role}`,
      role,
      contact: { name, phone, email },
      highlights,
      aboutMe,
      locationPref,
      salaryPref,
      pdfUrl,
      status: jobId ? 'submitted' : 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // n8n 팬아웃 (선택)
    try {
      const url = import.meta.env.VITE_N8N_WEBHOOK_APPLICATION_CREATED;
      if (url) {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appId: ref.id, jobId: jobId || null, ownerUid: currentUser.uid }),
        });
      }
    } catch {}

    alert(jobId ? '제출 완료!' : '초안 저장 완료!');
    nav(jobId ? `/jobs/${jobId}` : '/jobs');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">지원서 메이커</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            {!listening ? (
              <button className="btn" onClick={start}>🎤 음성 입력 시작</button>
            ) : (
              <button className="btn" onClick={stop}>⏹️ 음성 입력 종료</button>
            )}
            <button className="btn" onClick={() => setPartial('')}>지우기</button>
          </div>
          <textarea 
            className="w-full textarea" 
            rows={5} 
            placeholder="여기에 말한 내용이 누적됩니다 (필요 시 복사해 아래 필드에 붙여넣기)"
            value={partial} 
            onChange={e => setPartial(e.target.value)} 
          />

          <div className="grid grid-cols-2 gap-2">
            <input 
              className="input" 
              placeholder="이름" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
            <input 
              className="input" 
              placeholder="연락처(폰)" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
            />
            <input 
              className="input col-span-2" 
              placeholder="이메일" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
            <input 
              className="input col-span-2" 
              placeholder="희망 직무" 
              value={role} 
              onChange={e => setRole(e.target.value)} 
            />
            <input 
              className="input" 
              placeholder="희망 지역" 
              value={locationPref} 
              onChange={e => setLocationPref(e.target.value)} 
            />
            <input 
              className="input" 
              placeholder="희망 급여" 
              value={salaryPref} 
              onChange={e => setSalaryPref(e.target.value)} 
            />
            <textarea 
              className="textarea col-span-2" 
              rows={3} 
              placeholder="한 줄 소개 / 짧은 자기소개"
              value={aboutMe} 
              onChange={e => setAboutMe(e.target.value)} 
            />
            <textarea 
              className="textarea col-span-2" 
              rows={4} 
              placeholder="경력 하이라이트 (쉼표/줄바꿈으로 구분)"
              value={rawHighlights} 
              onChange={e => setRawHighlights(e.target.value)} 
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                checked={type === 'simple'} 
                onChange={() => setType('simple')} 
              /> 
              간단형
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                checked={type === 'essay'} 
                onChange={() => setType('essay')} 
              /> 
              자소서형
            </label>
          </div>

          <div className="flex gap-2">
            <button className="btn" onClick={onSubmit}>
              {jobId ? 'PDF 생성 후 즉시 제출' : 'PDF 생성 후 초안 저장'}
            </button>
            <button 
              className="btn" 
              onClick={async () => {
                const url = await handlePdf();
                window.open(url, '_blank');
              }}
            >
              미리보기(PDF)
            </button>
          </div>
        </div>

        <div className="border rounded-lg p-3 bg-white shadow-sm">
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      </div>
    </div>
  );
};
