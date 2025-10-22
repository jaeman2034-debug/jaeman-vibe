import { Link } from "react-router-dom";

export default function ErrorBoundary() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">페이지를 찾을 수 없어요</h1>
      <p className="text-sm text-gray-500">주소를 확인하거나 목록으로 돌아가세요.</p>
      <Link to="/events" className="underline mt-2 inline-block">
        모임 목록
      </Link>
    </div>
  );
}
