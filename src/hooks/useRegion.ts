import { useEffect, useState } from 'react';

const KEY = 'region';
const DEFAULT = 'KR';

export function useRegion(defaultRegion: string = DEFAULT) {
  const [region, setRegion] = useState(() => localStorage.getItem(KEY) || defaultRegion);

  useEffect(() => { localStorage.setItem(KEY, region); }, [region]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY && e.newValue) setRegion(e.newValue); };
    addEventListener('storage', onStorage);
    return () => removeEventListener('storage', onStorage);
  }, []);

  return { region, setRegion };
}
