import { NavLink, Outlet, Link, useParams } from "react-router-dom";

export default function EventPage(){
  const { id } = useParams();
  const base = `/events/${id}`;
  const Tab = (to:string,label:string)=>(
    <NavLink to={to} className={({isActive}) =>
      `px-3 py-2 rounded-xl border ${isActive?'bg-black text-white':''}`}>
      {label}
    </NavLink>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/events" className="underline text-sm">← 목록</Link>
        <Link to="checkout" className="px-3 py-2 rounded-xl border">참가하기</Link> {/* ✅ 상대 경로 */}
      </div>

      <div className="flex flex-wrap gap-2">
        {Tab(".", "정보")}
        {Tab("community","커뮤니티")}
        {Tab("matches","매치")}
        {Tab("courts","코트")}
        {Tab("live","라이브")}
        {Tab("manage","관리")}
      </div>

      {/* ⬇️ 이게 없으면 자식(=Checkout)이 렌더링되지 않습니다 */}
      <Outlet />
    </div>
  );
}
