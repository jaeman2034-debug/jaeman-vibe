import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

export default function AcademyForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState({
    title: "",
    description: "",
    instructor: "",
    date: "",
    price: "",
    capacity: "",
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCourse({ ...course, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnail(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!course.title || !course.instructor || !course.date) {
      alert("ê°•ì¢Œëª? ê°•ì‚¬ëª? ?¼ì •?€ ?„ìˆ˜ ?…ë ¥ ??ª©?…ë‹ˆ??");
      return;
    }

    setLoading(true);
    try {
      let thumbnailUrl = "";
      
      // ?¸ë„¤???…ë¡œ??      if (thumbnail) {
        const thumbnailRef = ref(storage, `academies/${uuidv4()}-${thumbnail.name}`);
        await uploadBytes(thumbnailRef, thumbnail);
        thumbnailUrl = await getDownloadURL(thumbnailRef);
      }

      // Firestore??ê°•ì¢Œ ?€??      const docRef = await addDoc(collection(db, "academies"), {
        ...course,
        price: course.price ? parseInt(course.price) : 0,
        capacity: course.capacity ? parseInt(course.capacity) : 0,
        thumbnailUrl,
        media: [],
        createdAt: new Date(),
      });

      alert("ê°•ì¢Œê°€ ?±ê³µ?ìœ¼ë¡??±ë¡?˜ì—ˆ?µë‹ˆ??");
      navigate(`/academy/${docRef.id}`);
    } catch (error) {
      console.error("ê°•ì¢Œ ?±ë¡ ?¤ë¥˜:", error);
      alert("ê°•ì¢Œ ?±ë¡???¤íŒ¨?ˆìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ê°•ì¢Œ ?±ë¡</h1>
        <p className="text-gray-600">?ˆë¡œ??ê°•ì¢Œë¥??±ë¡?´ì£¼?¸ìš”.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ê°•ì¢Œëª?*/}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ê°•ì¢Œëª?*
            </label>
            <input
              type="text"
              name="title"
              value={course.title}
              onChange={handleChange}
              placeholder="ê°•ì¢Œëª…ì„ ?…ë ¥?˜ì„¸??
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* ê°•ì‚¬ëª?*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ê°•ì‚¬ëª?*
            </label>
            <input
              type="text"
              name="instructor"
              value={course.instructor}
              onChange={handleChange}
              placeholder="ê°•ì‚¬ëª…ì„ ?…ë ¥?˜ì„¸??
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* ?¼ì • */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?¼ì • *
            </label>
            <input
              type="date"
              name="date"
              value={course.date}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* ?˜ê°•ë£?*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?˜ê°•ë£?(??
            </label>
            <input
              type="number"
              name="price"
              value={course.price}
              onChange={handleChange}
              placeholder="0 (ë¬´ë£Œ)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* ?•ì› */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?•ì› (ëª?
            </label>
            <input
              type="number"
              name="capacity"
              value={course.capacity}
              onChange={handleChange}
              placeholder="ìµœë? ?¸ì›"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* ?¸ë„¤??*/}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?¸ë„¤???´ë?ì§€
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {thumbnail && (
              <div className="mt-3">
                <img
                  src={URL.createObjectURL(thumbnail)}
                  alt="ë¯¸ë¦¬ë³´ê¸°"
                  className="w-32 h-20 object-cover rounded-lg border"
                />
                <p className="text-sm text-gray-500 mt-1">
                  ? íƒ???Œì¼: {thumbnail.name}
                </p>
              </div>
            )}
          </div>

          {/* ?¤ëª… */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ê°•ì¢Œ ?¤ëª…
            </label>
            <textarea
              name="description"
              value={course.description}
              onChange={handleChange}
              placeholder="ê°•ì¢Œ???€???ì„¸???¤ëª…???…ë ¥?˜ì„¸??
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* ë²„íŠ¼ */}
        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? "?±ë¡ ì¤?.." : "ê°•ì¢Œ ?±ë¡?˜ê¸°"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/academy")}
            className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            ì·¨ì†Œ
          </button>
        </div>
      </form>
    </div>
  );
}
