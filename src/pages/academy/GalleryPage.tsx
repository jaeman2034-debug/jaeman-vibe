import React, { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

export default function GalleryPage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ?”¹ ê°¤ëŸ¬ë¦??°ì´??ë¶ˆëŸ¬?¤ê¸°
  useEffect(() => {
    const fetchGallery = async () => {
      const querySnapshot = await getDocs(collection(db, "academy", "gallery", "items"));
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setGallery(data);
    };
    fetchGallery();
  }, []);

  // ?”¹ ?…ë¡œ??  const handleUpload = async () => {
    if (!files) return alert("?Œì¼??? íƒ?˜ì„¸??");
    setLoading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileRef = ref(storage, `academy/gallery/${uuidv4()}-${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        await addDoc(collection(db, "academy", "gallery", "items"), {
          url,
          type: file.type.startsWith("video") ? "video" : "image",
          createdAt: new Date(),
        });
      }
      alert("?…ë¡œ???„ë£Œ!");
      window.location.reload();
    } catch (err) {
      console.error("Upload error:", err);
      alert("?…ë¡œ???¤íŒ¨");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">?„ì¹´?°ë? ê°¤ëŸ¬ë¦?/h2>

      {/* ?…ë¡œ??UI */}
      <div className="mb-6">
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => setFiles(e.target.files)}
          className="border p-2 mr-2"
        />
        <button
          className="bg-green-600 text-white px-4 py-2 rounded ml-2"
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? "?…ë¡œ??ì¤?.." : "?…ë¡œ??}
        </button>
      </div>

      {/* ê°¤ëŸ¬ë¦??œì‹œ */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {gallery.map((item) =>
          item.type === "image" ? (
            <img 
              key={item.id} 
              src={item.url} 
              alt="gallery" 
              className="w-full h-40 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.open(item.url, '_blank')}
            />
          ) : (
            <video 
              key={item.id} 
              src={item.url} 
              controls 
              className="w-full h-40 rounded"
              preload="metadata"
            />
          )
        )}
      </div>
    </div>
  );
}
