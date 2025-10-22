import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSaves, SaveKey } from '@/hooks/useSaves';
import { shareOrCopy } from '@/utils/ui';
import AppLayout from '@/components/layout/AppLayout';

type SavedMeta = {
  key: SaveKey;
  kind: 'meetup' | 'job' | 'item';
  id: string;
};

function parseKey(key: SaveKey): SavedMeta {
  const [kind, id] = key.split(':') as [SavedMeta['kind'], string];
  return { key, kind, id };
}

// 데이터 해결 함수들 (실제로는 Firestore에서 가져와야 함)
async function resolveMeetup(id: string) {
  try {
    // TODO: Firestore에서 meetup 데이터 가져오기
    // const doc = await getDoc(doc(db, 'meetups', id));
    // return doc.exists() ? doc.data() : null;
    
    // 임시: 로컬스토리지에서 저장된 데이터 사용
    const savedData = localStorage.getItem(`meetup:${id}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      return { 
        title: parsed.title || `모임 ${id}`, 
        subtitle: parsed.location || '모임 설명...' 
      };
    }
    
    return { title: `모임 ${id}`, subtitle: '모임 설명...' };
  } catch {
    return { title: `모임 ${id}`, subtitle: '모임 설명...' };
  }
}

async function resolveJob(id: string) {
  try {
    // TODO: Firestore에서 job 데이터 가져오기
    // const doc = await getDoc(doc(db, 'jobs', id));
    // return doc.exists() ? doc.data() : null;
    
    // 임시: 로컬스토리지에서 저장된 데이터 사용
    const savedData = localStorage.getItem(`job:${id}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      return { 
        title: parsed.title || `일자리 ${id}`, 
        subtitle: `${parsed.company || '회사명'} · ${parsed.region || '지역'}` 
      };
    }
    
    return { title: `일자리 ${id}`, subtitle: '회사명 · 지역' };
  } catch {
    return { title: `일자리 ${id}`, subtitle: '회사명 · 지역' };
  }
}

async function resolveItem(id: string) {
  try {
    // TODO: Firestore에서 item 데이터 가져오기
    // const doc = await getDoc(doc(db, 'market', id));
    // return doc.exists() ? doc.data() : null;
    
    // 임시: 로컬스토리지에서 저장된 데이터 사용
    const savedData = localStorage.getItem(`item:${id}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      return { 
        title: parsed.title || `상품 ${id}`, 
        subtitle: `${parsed.price ? `${parsed.price.toLocaleString()}원` : '가격'} · ${parsed.region || '지역'}` 
      };
    }
    
    return { title: `상품 ${id}`, subtitle: '가격 · 지역' };
  } catch {
    return { title: `상품 ${id}`, subtitle: '가격 · 지역' };
  }
}

interface RowProps {
  title: string;
  subtitle?: string;
  href: string;
  right?: React.ReactNode;
  onRemove: () => void;
}

function Row({ title, subtitle, href, right, onRemove }: RowProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0" onClick={() => navigate(href)}>
        <div className="font-medium text-sm truncate">{title}</div>
        {subtitle && <div className="text-xs text-zinc-500 truncate">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-1">
        {right}
        <button 
          aria-label="삭제" 
          onClick={onRemove}
          className="px-2 py-1 text-sm rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function SavesPage() {
  const { refresh, toggle } = useSaves();
  const [keys, setKeys] = useState<SaveKey[]>([]);
  const [details, setDetails] = useState<Record<string, any>>({});

  // keys 가져오기: useSaves()는 내부 state로 관리하므로 trick으로 refresh 후 로컬스토리지에서 읽을 수도 있지만,
  // 여기서는 isSaved를 쿼리할 수 없어 목록용으로 간단히 localStorage를 병행 조회
  useEffect(() => {
    try {
      const arr: SaveKey[] = JSON.parse(localStorage.getItem('yago:saves') || '[]');
      setKeys(arr);
    } catch { 
      setKeys([] as any); 
    }
  }, [refresh]);

  useEffect(() => {
    (async () => {
      const out: Record<string, any> = {};
      await Promise.all(keys.map(async (k) => {
        const { kind, id } = parseKey(k);
        try {
          out[k] = kind === 'meetup' ? await resolveMeetup(id)
                 : kind === 'job'    ? await resolveJob(id)
                 : await resolveItem(id);
        } catch {}
      }));
      setDetails(out);
    })();
  }, [keys.join(',')]);

  const groups = useMemo(() => {
    const g = { meetup: [] as SavedMeta[], job: [] as SavedMeta[], item: [] as SavedMeta[] };
    keys.forEach((k) => { 
      const p = parseKey(k); 
      (g as any)[p.kind].push(p); 
    });
    return g;
  }, [keys.join(',')]);

  const Section = ({ title, list }: { title: string; list: SavedMeta[] }) => (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">{title}</h3>
      {list.length === 0 ? <div className="text-sm text-zinc-500">비어있어요.</div> : null}
      <div className="flex flex-col gap-2">
        {list.map((p) => {
          const d = details[p.key];
          const href = p.kind === 'meetup' ? `/meetups/${p.id}`
                    : p.kind === 'job'    ? `/jobs/${p.id}`
                    : `/market/${p.id}`;
          return (
            <Row 
              key={p.key}
              title={d?.title || `${p.kind}:${p.id}`}
              subtitle={d?.subtitle}
              href={href}
              right={
                <button 
                  aria-label="공유" 
                  onClick={() => shareOrCopy({ title: d?.title || p.key, url: location.origin + href })}
                  className="px-2 py-1 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  🔗
                </button>
              }
              onRemove={() => toggle(`${p.kind}:${p.id}` as SaveKey)}
            />
          );
        })}
      </div>
    </section>
  );

  const clearAll = () => {
    localStorage.setItem('yago:saves', '[]');
    setKeys([]);
    // Firestore에서도 삭제 (로그인된 경우)
    keys.forEach(key => toggle(key));
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">저장함</h1>
            <div className="text-sm text-zinc-500">모임·일자리·마켓에서 ⭐ 저장한 항목이 모여요.</div>
          </div>
          {keys.length > 0 && (
            <button 
              className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              onClick={clearAll}
            >
              모두 비우기
            </button>
          )}
        </header>
        
        {keys.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              ⭐
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              저장한 항목이 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              관심 있는 모임, 일자리, 상품에 ⭐ 버튼을 눌러 저장해보세요!
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => window.location.href = '/meetups'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                모임 둘러보기
              </button>
              <button 
                onClick={() => window.location.href = '/jobs'}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                일자리 둘러보기
              </button>
              <button 
                onClick={() => window.location.href = '/market'}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                마켓 둘러보기
              </button>
            </div>
          </div>
        ) : (
          <>
            <Section title="모임" list={groups.meetup} />
            <Section title="일자리" list={groups.job} />
            <Section title="마켓" list={groups.item} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
