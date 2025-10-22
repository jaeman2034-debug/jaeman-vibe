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
    
    // ??검�?    if (!form.title.trim()) {
      alert("강좌명을 ?�력?�주?�요.");
      return;
    }
    if (!form.coach.trim()) {
      alert("코치 ?�름???�력?�주?�요.");
      return;
    }
    if (!form.startDate || !form.endDate) {
      alert("?�작?�과 종료?�을 ?�택?�주?�요.");
      return;
    }
    if (new Date(form.startDate) >= new Date(form.endDate)) {
      alert("종료?��? ?�작?�보????��???�니??");
      return;
    }
    if (form.capacity < 1 || form.capacity > 100) {
      alert("?�원?� 1�??�상 100�??�하�??�정?�주?�요.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "academyCourses"), {
        ...form,
        createdAt: new Date()
      });
      
      alert("강좌가 ?�공?�으�??�록?�었?�니?? ??);
      navigate("/academy/courses");
    } catch (err) {
      console.error("강좌 ?�록 ?�류:", err);
      alert("강좌 ?�록 �??�류가 발생?�습?�다. ??);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">????강좌 ?�록</h2>
        <Link 
          to="/academy/courses" 
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          ??강좌 목록?�로
        </Link>
      </div>

      <div className="bg-white border rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 강좌�?*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              강좌�?*
            </label>
            <input
              name="title"
              type="text"
              placeholder="?? 주말 ?�소??축구교실"
              value={form.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* ?�명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              강좌 ?�명 *
            </label>
            <textarea
              name="description"
              placeholder="강좌???�???�세???�명???�력?�주?�요..."
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* 코치�?*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              코치 ?�름 *
            </label>
            <input
              name="coach"
              type="text"
              placeholder="?? 김코치"
              value={form.coach}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* ?�짜 ?�택 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ?�작??*
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
                종료??*
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

          {/* ?�원 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?�원 (�? *
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
            <p className="text-sm text-gray-500 mt-1">1�??�상 100�??�하�??�정?�주?�요</p>
          </div>

          {/* ?�출 버튼 */}
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
              {loading ? '?�록 �?..' : '강좌 ?�록'}
            </button>
            <button
              type="button"
              onClick={() => navigate("/academy/courses")}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
