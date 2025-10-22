import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, storage } from "../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ProductEditPage() {
  const [user] = useAuthState(auth);
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    price: "",
    description: "",
    location: "",
    imageUrl: "",
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ref = doc(db, "marketItems", id as string);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          
          // ?‘ì„±???•ì¸
          if (user && data.sellerId !== user.uid) {
            alert("?˜ì • ê¶Œí•œ???†ìŠµ?ˆë‹¤.");
            navigate("/market");
            return;
          }

          setForm({
            title: data.title || "",
            price: data.price || "",
            description: data.description || data.caption_ko || "",
            location: data.location?.region || data.location || "",
            imageUrl: data.imageUrl || data.fileUrl || "",
          });
          setPreview(data.imageUrl || data.fileUrl || null);
        } else {
          alert("?í’ˆ??ì°¾ì„ ???†ìŠµ?ˆë‹¤.");
          navigate("/market");
        }
      } catch (error) {
        console.error("?°ì´??ë¡œë“œ ?¤ë¥˜:", error);
        alert("?°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    } else {
      alert("ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??");
      navigate("/market");
    }
  }, [id, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ???´ë?ì§€ ë³€ê²???ë¯¸ë¦¬ë³´ê¸°
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const previewUrl = URL.createObjectURL(selected);
      setPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = form.imageUrl;

      // ?????Œì¼ ? íƒ ??Firebase Storage ?…ë¡œ??      if (file) {
        const timestamp = Date.now();
        const storageRef = ref(storage, `marketImages/${id}/${timestamp}_${file.name}`);
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);
      }

      // ??Firestore ?…ë°?´íŠ¸
      const docRef = doc(db, "marketItems", id as string);
      await updateDoc(docRef, {
        title: form.title,
        price: Number(form.price),
        description: form.description,
        caption_ko: form.description,
        location: form.location,
        imageUrl,
        fileUrl: imageUrl,
        updatedAt: serverTimestamp(),
      });

      alert("?í’ˆ???±ê³µ?ìœ¼ë¡??˜ì •?˜ì—ˆ?µë‹ˆ??");
      navigate(`/product/${id}`);
    } catch (error) {
      console.error("?€???¤ë¥˜:", error);
      alert("?€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">?°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ” ì¤?..</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="p-6 max-w-3xl mx-auto bg-white rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold mb-6">?ï¸ ?í’ˆ ?˜ì •</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ?–¼ï¸??´ë?ì§€ ë¯¸ë¦¬ë³´ê¸° */}
          {preview && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                ?„ì¬ ?´ë?ì§€
              </label>
              <img
                src={preview}
                alt="ë¯¸ë¦¬ë³´ê¸°"
                className="w-full max-h-64 object-contain rounded-xl shadow-md border"
              />
            </div>
          )}

          {/* ?“¤ ?´ë?ì§€ ?…ë¡œ??*/}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              ???´ë?ì§€ ? íƒ {file && <span className="text-green-600">??? íƒ??/span>}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
            />
            <p className="mt-1 text-xs text-gray-500">
              ?’¡ ???´ë?ì§€ë¥?? íƒ?˜ì? ?Šìœ¼ë©?ê¸°ì¡´ ?´ë?ì§€ê°€ ? ì??©ë‹ˆ??
            </p>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              ?í’ˆëª?<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="?? ì¶•êµ¬ê³?(???œí’ˆ)"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              ê°€ê²?(?? <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="?? 50000"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              ?í’ˆ ?¤ëª… <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 w-full h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="?í’ˆ???€???ì„¸???¤ëª…???…ë ¥?´ì£¼?¸ìš”."
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              ê±°ë˜ ?„ì¹˜
            </label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="?? ?œìš¸ ê°•ë‚¨êµ?
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              disabled={saving}
            >
              ì·¨ì†Œ
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? "?€??ì¤?.." : "?’¾ ?€??}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
