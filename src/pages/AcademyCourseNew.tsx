import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

const db = getFirestore(app);

type CourseForm = {
  title: string;
  description: string;
  coach: string;
  startDate: string;
  endDate: string;
  capacity: number;
};

export default function AcademyCourseNew() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CourseForm>({
    title: "",
    description: "",
    coach: "",
    startDate: "",
    endDate: "",
    capacity: 30
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 30 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ??ê²€ì¦?    if (!form.title.trim()) {
      alert("ê°•ì¢Œëª…ì„ ?…ë ¥?´ì£¼?¸ìš”.");
      return;
    }
    if (!form.coach.trim()) {
      alert("ì½”ì¹˜ ?´ë¦„???…ë ¥?´ì£¼?¸ìš”.");
      return;
    }
    if (!form.startDate || !form.endDate) {
      alert("?œì‘?¼ê³¼ ì¢…ë£Œ?¼ì„ ? íƒ?´ì£¼?¸ìš”.");
      return;
    }
    if (new Date(form.startDate) >= new Date(form.endDate)) {
      alert("ì¢…ë£Œ?¼ì? ?œì‘?¼ë³´????–´???©ë‹ˆ??");
      return;
    }
    if (form.capacity < 1 || form.capacity > 100) {
      alert("?•ì›?€ 1ëª??´ìƒ 100ëª??´í•˜ë¡??¤ì •?´ì£¼?¸ìš”.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "academyCourses"), {
        ...form,
        createdAt: new Date()
      });
      
      alert("ê°•ì¢Œê°€ ?±ê³µ?ìœ¼ë¡??±ë¡?˜ì—ˆ?µë‹ˆ?? ??);
      navigate("/academy/courses");
    } catch (err) {
      console.error("ê°•ì¢Œ ?±ë¡ ?¤ë¥˜:", err);
      alert("ê°•ì¢Œ ?±ë¡ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤. ??);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">????ê°•ì¢Œ ?±ë¡</h2>
        <Link 
          to="/academy/courses" 
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          ??ê°•ì¢Œ ëª©ë¡?¼ë¡œ
        </Link>
      </div>

      <div className="bg-white border rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ê°•ì¢Œëª?*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ê°•ì¢Œëª?*
            </label>
            <input
              name="title"
              type="text"
              placeholder="?? ì£¼ë§ ? ì†Œ??ì¶•êµ¬êµì‹¤"
              value={form.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* ?¤ëª… */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ê°•ì¢Œ ?¤ëª… *
            </label>
            <textarea
              name="description"
              placeholder="ê°•ì¢Œ???€???ì„¸???¤ëª…???…ë ¥?´ì£¼?¸ìš”..."
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* ì½”ì¹˜ëª?*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ì½”ì¹˜ ?´ë¦„ *
            </label>
            <input
              name="coach"
              type="text"
              placeholder="?? ê¹€ì½”ì¹˜"
              value={form.coach}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* ? ì§œ ? íƒ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ?œì‘??*
              </label>
              <input
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ì¢…ë£Œ??*
              </label>
              <input
                name="endDate"
                type="date"
                value={form.endDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* ?•ì› */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?•ì› (ëª? *
            </label>
            <input
              name="capacity"
              type="number"
              min="1"
              max="100"
              value={form.capacity}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">1ëª??´ìƒ 100ëª??´í•˜ë¡??¤ì •?´ì£¼?¸ìš”</p>
          </div>

          {/* ?œì¶œ ë²„íŠ¼ */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                loading
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {loading ? '?±ë¡ ì¤?..' : 'ê°•ì¢Œ ?±ë¡'}
            </button>
            <button
              type="button"
              onClick={() => navigate("/academy/courses")}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ì·¨ì†Œ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
