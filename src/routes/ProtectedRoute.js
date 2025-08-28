import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading)
        return _jsx("div", { style: { padding: 24 }, children: "\uB85C\uB529 \uC911\u2026" });
    if (!user)
        return _jsx(Navigate, { to: "/start", replace: true });
    return children;
}
