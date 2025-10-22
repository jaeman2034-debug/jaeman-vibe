import React, { useEffect, useState } from 'react';

function getTheme() { 
  return localStorage.getItem('theme') || 'system'; 
}

function applyTheme(t: string) {
  const root = document.documentElement;
  const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = t === 'dark' || (t === 'system' && sysDark);
  root.classList.toggle('dark', dark);
  localStorage.setItem('theme', t);
}

function getScale() { 
  return Number(localStorage.getItem('uiScale') || '1'); 
}

function applyScale(s: number) {
  document.documentElement.style.fontSize = `${Math.round(s * 100)}%`;
  localStorage.setItem('uiScale', String(s));
}

export default function StaffBadge({ eventId }: { eventId: string }) {
  const [theme, setTheme] = useState(getTheme());
  const [scale, setScale] = useState(getScale());
  const [locked, setLocked] = useState(!!sessionStorage.getItem(`kiosk:${eventId}:locked`));
  const [pin, setPin] = useState<string>('');

  useEffect(() => { 
    applyTheme(theme); 
  }, [theme]);
  
  useEffect(() => { 
    applyScale(scale); 
  }, [scale]);

  const lock = () => {
    const p = prompt('잠금 PIN 4자리(숫자) 설정'); 
    if (!p || !/^\d{4}$/.test(p)) return;
    
    sessionStorage.setItem(`kiosk:${eventId}:locked`, '1');
    sessionStorage.setItem(`kiosk:${eventId}:pin`, p);
    setLocked(true);
  };
  
  const unlock = () => {
    const want = prompt('PIN 입력(4자리)') || '';
    const real = sessionStorage.getItem(`kiosk:${eventId}:pin`);
    
    if (want === real) { 
      sessionStorage.removeItem(`kiosk:${eventId}:locked`); 
      setLocked(false); 
    } else {
      alert('PIN 불일치');
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 border">
        STAFF
      </span>
      
      <div className="flex items-center gap-1">
        <select 
          value={theme} 
          onChange={e => setTheme(e.target.value)} 
          className="border rounded-md px-2 py-1"
        >
          <option value="system">시스템</option>
          <option value="light">라이트</option>
          <option value="dark">다크</option>
        </select>
        
        <div className="flex items-center gap-1">
          <span>글자</span>
          <input 
            type="range" 
            min={0.9} 
            max={1.5} 
            step={0.05} 
            value={scale} 
            onChange={e => setScale(Number(e.target.value))}
            className="w-16"
          />
        </div>
        
        {!locked ? (
          <button 
            onClick={lock} 
            className="px-2 py-1 rounded-md border hover:bg-gray-50"
          >
            스캐너 잠금
          </button>
        ) : (
          <button 
            onClick={unlock} 
            className="px-2 py-1 rounded-md border hover:bg-gray-50"
          >
            잠금 해제
          </button>
        )}
      </div>
    </div>
  );
}
