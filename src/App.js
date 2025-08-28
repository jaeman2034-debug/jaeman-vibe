import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/features/auth/AuthContext';
import ProtectedRoute from '@/routes/ProtectedRoute';
import StartScreen from '@/features/start/StartScreen';
import VoicePage from '@/pages/VoicePage';
import AppShell from '@/components/AppShell';
import Market from '@/pages/Market';
import WhyPage from '@/features/why/WhyPage';
import ProductDetail from '@/features/market/detail/ProductDetail';
import ProductCreate from '@/features/market/edit/ProductCreate';
import GroupsList from '@/features/groups/GroupsList';
import GroupDetail from '@/features/groups/GroupDetail';
import GroupCreate from '@/features/groups/GroupCreate';
import JobsList from '@/features/jobs/JobsList';
import JobDetail from '@/features/jobs/JobDetail';
import JobCreate from '@/features/jobs/JobCreate';
import AdminTools from '@/admin/AdminTools';
import Dashboard from '@/admin/Dashboard';
import { VoiceProvider } from '@/voice/VoiceContext';
import VoiceMic from '@/voice/VoiceMic';
import { installGlobalErrorHooks, installDiagAPI } from '@/diag/globals';
export default function App() {
    useEffect(() => {
        installGlobalErrorHooks();
        installDiagAPI();
    }, []);
    return (_jsx(AuthProvider, { children: _jsx(Router, { children: _jsxs(VoiceProvider, { children: [_jsxs(Routes, { children: [_jsx(Route, { path: "/start", element: _jsx(StartScreen, {}) }), _jsx(Route, { path: "/voice", element: _jsx(VoicePage, {}) }), _jsxs(Route, { element: _jsx(AppShell, {}), children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/start", replace: true }) }), _jsx(Route, { path: "/market", element: _jsx(Market, {}) }), _jsx(Route, { path: "/why", element: _jsx(WhyPage, {}) }), _jsx(Route, { path: "/product/new", element: _jsx(ProtectedRoute, { children: _jsx(ProductCreate, {}) }) }), _jsx(Route, { path: "/product/:id", element: _jsx(ProductDetail, {}) }), _jsx(Route, { path: "/groups", element: _jsx(GroupsList, {}) }), _jsx(Route, { path: "/groups/new", element: _jsx(ProtectedRoute, { children: _jsx(GroupCreate, {}) }) }), _jsx(Route, { path: "/groups/:id", element: _jsx(GroupDetail, {}) }), _jsx(Route, { path: "/jobs", element: _jsx(JobsList, {}) }), _jsx(Route, { path: "/jobs/new", element: _jsx(ProtectedRoute, { children: _jsx(JobCreate, {}) }) }), _jsx(Route, { path: "/jobs/:id", element: _jsx(JobDetail, {}) }), _jsx(Route, { path: "/admin/tools", element: _jsx(ProtectedRoute, { children: _jsx(AdminTools, {}) }) }), _jsx(Route, { path: "/admin/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(Dashboard, {}) }) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/start", replace: true }) })] }), _jsx(VoiceMic, {}), _jsx(Toaster, { position: "top-right" })] }) }) }));
}
