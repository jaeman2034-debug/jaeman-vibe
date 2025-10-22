import React, { useState } from "react";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase"; // Firebase ì´ˆê¸°??ë¶ˆëŸ¬?¤ê¸°

const db = getFirestore(app);
const storage = getStorage(app);

export default function AcademyFormSimple() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    instructor: "",
    date: "",
    price: "",
    capacity: "",
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let thumbnailUrl = "";
      if (thumbnail) {
        const storageRef = ref(storage, `academy/${Date.now()}-${thumbnail.name}`);
        await uploadBytes(storageRef, thumbnail);
        thumbnailUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "academies"), {
        ...form,
        price: Number(form.price),
        capacity: Number(form.capacity),
        thumbnailUrl,
        createdAt: new Date(),
      });
      alert("ê°•ì¢Œê°€ ?±ë¡?˜ì—ˆ?µë‹ˆ????);
      // ??ì´ˆê¸°??      setForm({ title: "", description: "", instructor: "", date: "", price: "", capacity: "" });
      setThumbnail(null);
      // ?Œì¼ ?…ë ¥ ì´ˆê¸°??      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error(err);
      alert("?±ë¡ ì¤??¤ë¥˜ ë°œìƒ ??);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">ê°•ì¢Œ ?±ë¡</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input 
          name="title" 
          placeholder="ê°•ì¢Œëª? 
          value={form.title} 
          onChange={handleChange} 
          className="border p-2" 
        />
        <textarea 
          name="description" 
          placeholder="?¤ëª…" 
          value={form.description} 
          onChange={handleChange} 
          className="border p-2" 
        />
        <input 
          name="instructor" 
          placeholder="ê°•ì‚¬ëª? 
          value={form.instructor} 
          onChange={handleChange} 
          className="border p-2" 
        />
        <input 
          name="date" 
          type="date" 
          value={form.date} 
          onChange={handleChange} 
          className="border p-2" 
        />
        <input 
          name="price" 
          placeholder="?˜ê°•ë£? 
          value={form.price} 
          onChange={handleChange} 
          className="border p-2" 
        />
        <input 
          name="capacity" 
          placeholder="?•ì›" 
          value={form.capacity} 
          onChange={handleChange} 
          className="border p-2" 
        />
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => setThumbnail(e.target.files?.[0] || null)} 
        />
        <button 
          type="submit" 
          className="bg-blue-500 text-white p-2 rounded"
        >
          ?±ë¡?˜ê¸°
        </button>
      </form>
    </div>
  );
}
