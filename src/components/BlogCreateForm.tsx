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
      alert("?�목???�력?�세??");
      return;
    }

    setIsUploading(true);
    try {
      const blogId = crypto.randomUUID();
      let imageUrl = "";

      // ?��?지 ?�로??      if (file) {
        console.log("?�� ?��?지 ?�로???�작:", file.name);
        const fileRef = ref(storage, `blogs/${blogId}/cover.png`);
        await uploadBytes(fileRef, file);
        imageUrl = await getDownloadURL(fileRef);
        console.log("???��?지 ?�로???�료:", imageUrl);
      }

      // Firestore ?�??      await setDoc(doc(db, "blogs", blogId), {
        title,
        content,
        imageUrl,
        createdAt: new Date(),
        authorId: currentUser?.uid || null,
        authorName: currentUser?.displayName || "?�명",
        authorPhotoURL: currentUser?.photoURL || null,
      });

      console.log("??블로�??�???�료:", blogId);
      alert("블로그�? ?�공?�으�??�성?�었?�니??");

      // ??초기??      setTitle("");
      setContent("");
      setFile(null);
    } catch (err) {
      console.error("블로�??�성 ?�패:", err);
      alert("블로�??�성???�패?�습?�다. ?�시 ?�도?�주?�요.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        ?�� ??블로�??�성
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ?�목
          </label>
          <input
            type="text"
            placeholder="블로�??�목???�력?�세??
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ?�용
          </label>
          <textarea
            placeholder="블로�??�용???�력?�세??
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ?�???��?지
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
                ?�택???�일: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "?�성 �?.." : "?�성?�기"}
        </button>
      </form>
    </div>
  );
}
