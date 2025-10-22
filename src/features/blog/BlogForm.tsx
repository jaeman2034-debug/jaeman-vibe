import { useState } from "react";
import { createBlog } from "./blogApi";

export default function BlogForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createBlog(title, content);
      setStatus(`✅ ${res.message} (${res.title || "제목 없음"})`);
    } catch (err) {
      setStatus("❌ 저장 실패");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded">
      <h2 className="text-xl font-bold mb-2">블로그 작성</h2>
      <input
        className="border p-2 w-full mb-2"
        placeholder="제목 입력"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="border p-2 w-full mb-2"
        placeholder="본문 입력"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button className="bg-blue-500 text-white px-4 py-2 rounded">
        저장
      </button>
      {status && <p className="mt-2">{status}</p>}
    </form>
  );
}
