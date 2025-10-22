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
      alert("강좌�? 강사�? ?�정?� ?�수 ?�력 ??��?�니??");
      return;
    }

    setLoading(true);
    try {
      let thumbnailUrl = "";
      
      // ?�네???�로??      if (thumbnail) {
        const thumbnailRef = ref(storage, `academies/${uuidv4()}-${thumbnail.name}`);
        await uploadBytes(thumbnailRef, thumbnail);
        thumbnailUrl = await getDownloadURL(thumbnailRef);
      }

      // Firestore??강좌 ?�??      const docRef = await addDoc(collection(db, "academies"), {
        ...course,
        price: course.price ? parseInt(course.price) : 0,
        capacity: course.capacity ? parseInt(course.capacity) : 0,
        thumbnailUrl,
        media: [],
        createdAt: new Date(),
      });

      alert("강좌가 ?�공?�으�??�록?�었?�니??");
      navigate(`/academy/${docRef.id}`);
    } catch (error) {
      console.error("강좌 ?�록 ?�류:", error);
      alert("강좌 ?�록???�패?�습?�다. ?�시 ?�도?�주?�요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">강좌 ?�록</h1>
        <p className="text-gray-600">?�로??강좌�??�록?�주?�요.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 강좌�?*/}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              강좌�?*
            </label>
            <input
              type="text"
              name="title"
              value={course.title}
              onChange={handleChange}
              placeholder="강좌명을 ?�력?�세??
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 강사�?*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              강사�?*
            </label>
            <input
              type="text"
              name="instructor"
              value={course.instructor}
              onChange={handleChange}
              placeholder="강사명을 ?�력?�세??
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* ?�정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?�정 *
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

          {/* ?�강�?*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?�강�?(??
            </label>
            <input
              type="number"
              name="price"
              value={course.price}
              onChange={handleChange}
              placeholder="0 (무료)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* ?�원 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?�원 (�?
            </label>
            <input
              type="number"
              name="capacity"
              value={course.capacity}
              onChange={handleChange}
              placeholder="최�? ?�원"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* ?�네??*/}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?�네???��?지
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
                  alt="미리보기"
                  className="w-32 h-20 object-cover rounded-lg border"
                />
                <p className="text-sm text-gray-500 mt-1">
                  ?�택???�일: {thumbnail.name}
                </p>
              </div>
            )}
          </div>

          {/* ?�명 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              강좌 ?�명
            </label>
            <textarea
              name="description"
              value={course.description}
              onChange={handleChange}
              placeholder="강좌???�???�세???�명???�력?�세??
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? "?�록 �?.." : "강좌 ?�록?�기"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/academy")}
            className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
