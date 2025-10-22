import { Link } from "react-router-dom";

export default function AcademyMainPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">?�카?��? 메인</h1>
      <nav className="flex gap-4 mt-4">
        <Link to="/academy/courses">강좌</Link>
        <Link to="/academy/attendance">출석</Link>
        <Link to="/academy/reports">리포??/Link>
        <Link to="/academy/gallery">갤러�?/Link>
        <Link to="/academy/chatbot">AI ?�담</Link>
      </nav>
    </div>
  );
}
