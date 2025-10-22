import { useParams } from "react-router-dom";

export default function EventInfo() {
  const { id } = useParams();
  
  return (
    <div className="rounded-2xl border p-4">
      이벤트 {id} 정보 섹션
    </div>
  );
}
