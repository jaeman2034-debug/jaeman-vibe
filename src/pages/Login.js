import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from '@/lib/auth';
export default function Login() { const { signInWithGoogle } = useAuth(); return (_jsxs("div", { className: "p-6", children: ["      ", _jsxs("h1", { className: "text-xl font-bold", children: ["\uB85C\uADF8??/h1>      ", _jsx("button", { className: "btn mt-4", onClick: signInWithGoogle, children: "        Google\uFFFD?\uB85C\uADF8??      " }), "    "] })] })); }
