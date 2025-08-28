import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
export default function RequireAuth({ children }) { const [state, setState] = useState('loading'); useEffect(() => { const unsub = onAuthStateChanged(auth, u => setState(u ? 'ok' : 'no')); return () => unsub(); }, []); if (state === 'loading')
    return _jsxs("div", { style: { padding: 24 }, children: ["\uB85C\uADF8???\uFFFD\uD0DC ?\uFFFD\uC778 \uC911\uFFFD?/div>;  if (state === 'no') return ", _jsx(Navigate, { to: "/login", replace: true }), ";  return children;} "] }); }
