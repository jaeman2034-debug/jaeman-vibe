// src/App.tsx
import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "1fr" }}>
      {/* 필요하면 여기 헤더/푸터 추가 */}
      <Outlet />
    </div>
  );
}
