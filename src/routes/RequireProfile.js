import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { getUid } from '../lib/auth';
export default function RequireProfile({ children }) { const uid = getUid(); if (!uid)
    return _jsx(Navigate, { to: "/login", replace: true }); } // TODO: phoneNumber 체크??별도 ?�수�?구현 ?�요  // if (!user.phoneNumber) return <Navigate to="/signup/phone-voice" replace />;  return children;} 
