import { useEffect, useState } from 'react';
import { getHealth } from '@/lib/health';

export default function AppFooter() {
  const [h, setH] = useState<{version?:string; buildTime?:string}>({});
  useEffect(() => { getHealth().then(setH).catch(console.error); }, []);
  return (
    <footer className="text-xs text-gray-500 dark:text-gray-400 text-center py-3">
      v{h.version ?? 'dev'} • {h.buildTime ? new Date(h.buildTime).toLocaleString() : '-'}
    </footer>
  );
}
