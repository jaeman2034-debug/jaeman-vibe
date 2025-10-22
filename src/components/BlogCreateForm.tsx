import { useState } from "react";
import { db, storage } from "../lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../hooks/useAuth";

export default function BlogCreateForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert("?œëª©???…ë ¥?˜ì„¸??");
      return;
    }

    setIsUploading(true);
    try {
      const blogId = crypto.randomUUID();
      let imageUrl = "";

      // ?´ë?ì§€ ?…ë¡œ??      if (file) {
        console.log("?“¸ ?´ë?ì§€ ?…ë¡œ???œì‘:", file.name);
        const fileRef = ref(storage, `blogs/${blogId}/cover.png`);
        await uploadBytes(fileRef, file);
        imageUrl = await getDownloadURL(fileRef);
        console.log("???´ë?ì§€ ?…ë¡œ???„ë£Œ:", imageUrl);
      }

      // Firestore ?€??      await setDoc(doc(db, "blogs", blogId), {
        title,
        content,
        imageUrl,
        createdAt: new Date(),
        authorId: currentUser?.uid || null,
        authorName: currentUser?.displayName || "?µëª…",
        authorPhotoURL: currentUser?.photoURL || null,
      });

      console.log("??ë¸”ë¡œê·??€???„ë£Œ:", blogId);
      alert("ë¸”ë¡œê·¸ê? ?±ê³µ?ìœ¼ë¡??‘ì„±?˜ì—ˆ?µë‹ˆ??");

      // ??ì´ˆê¸°??      setTitle("");
      setContent("");
      setFile(null);
    } catch (err) {
      console.error("ë¸”ë¡œê·??‘ì„± ?¤íŒ¨:", err);
      alert("ë¸”ë¡œê·??‘ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        ?“ ??ë¸”ë¡œê·??‘ì„±
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ?œëª©
          </label>
          <input
            type="text"
            placeholder="ë¸”ë¡œê·??œëª©???…ë ¥?˜ì„¸??
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ?´ìš©
          </label>
          <textarea
            placeholder="ë¸”ë¡œê·??´ìš©???…ë ¥?˜ì„¸??
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ?€???´ë?ì§€
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {file && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ? íƒ???Œì¼: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "?‘ì„± ì¤?.." : "?‘ì„±?˜ê¸°"}
        </button>
      </form>
    </div>
  );
}
