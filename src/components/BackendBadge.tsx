import { useEffect, useState } from 'react';
import { httpHealth } from '@/lib/diag';

export default function BackendBadge() {
  const [text, setText] = useState('checking…');
  useEffect(() => {
    httpHealth().then((h) => setText(h.ok ? 'Backend: OK' : `Backend: ${h.status}`));
  }, []);
  return <span className="px-2 py-1 rounded bg-green-600 text-white text-sm">{text}</span>;
}
