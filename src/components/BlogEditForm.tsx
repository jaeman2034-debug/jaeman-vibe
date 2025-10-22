import { useState } from "react";
import { db, storage } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface BlogEditFormProps {
  post: { id: string; title: string; content: string; imageUrl?: string };
  onClose: () => void;
}

export default function BlogEditForm({ post, onClose }: BlogEditFormProps) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let newImageUrl = post.imageUrl || "";

      if (file) {
        const fileRef = ref(storage, `blogs/${post.id}/cover.png`);
        await uploadBytes(fileRef, file);
        newImageUrl = await getDownloadURL(fileRef);
      }

      await updateDoc(doc(db, "blogs", post.id), {
        title,
        content,
        imageUrl: newImageUrl,
        updatedAt: new Date(),
      });

      onClose();
    } catch (err) {
      console.error("ë¸”ë¡œê·??˜ì • ?¤íŒ¨:", err);
      alert("ë¸”ë¡œê·??˜ì •???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 w-full"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="border p-2 w-full"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "?˜ì • ì¤?.." : "?˜ì •?˜ê¸°"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          ì·¨ì†Œ
        </button>
      </div>
    </form>
  );
}
