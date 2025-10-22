import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import PostCard from "../components/PostCard";

interface BlogData {
  teamName: string;
  region: string;
  intro: string;
  image?: string;
  autoPost?: string;
}

export default function TeamBlogGenerator() {
  const navigate = useNavigate();
  const [form, setForm] = useState<BlogData>({
    teamName: "",
    region: "",
    intro: "",
    image: "",
  });
  const [generated, setGenerated] = useState<BlogData | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGenerate = async () => {
    if (!form.teamName || !form.region || !form.intro) {
      alert("?€ëª? ì§€?? ?Œê°œë¥?ëª¨ë‘ ?…ë ¥?´ì£¼?¸ìš”.");
      return;
    }

    setIsCreating(true);
    
    try {
      // ?”¥ ?¤ì œ êµ¬í˜„: ?€ ë¬¸ì„œ ?ì„±
      const teamDoc = await addDoc(collection(db, "teams"), {
        name: form.teamName,
        region: form.region,
        intro: form.intro,
        image: form.image,
        createdAt: new Date(),
        status: "active",
      });

      setTeamId(teamDoc.id);

      // ?ë™ ë¸”ë¡œê·??¬ìŠ¤???ì„±
      const autoPost = `${form.teamName}??${form.region}?ì„œ ?œë™?˜ëŠ” ?€?…ë‹ˆ?? 
${form.intro} 

ë§ì? ë¶„ë“¤ê³??¨ê»˜ ì¦ê²ê²??´ë™?˜ê³  ?¶ìŠµ?ˆë‹¤!
?€??ê´€?¬ì´ ?ˆìœ¼?œë©´ ?¸ì œ???°ë½ì£¼ì„¸??`;

      setGenerated({ ...form, autoPost });

      // ë¸”ë¡œê·??¬ìŠ¤?¸ë„ ?ë™ ?ì„±
      await addDoc(collection(db, "blogs"), {
        title: `${form.teamName} ê³µì‹ ë¸”ë¡œê·?,
        content: autoPost,
        author: "system",
        authorName: form.teamName,
        teamId: teamDoc.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    } catch (error) {
      console.error("?€ ?ì„± ?¤ë¥˜:", error);
      alert("?€ ?ì„± ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setIsCreating(false);
    }
  };

  const goToTeamManagement = () => {
    if (teamId) {
      navigate(`/teams/${teamId}/dashboard`);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">?€ ë¸”ë¡œê·??ë™ ?ì„±ê¸?/h1>

      {!generated ? (
        <div className="space-y-3">
          <input
            name="teamName"
            placeholder="?€ ?´ë¦„"
            value={form.teamName}
            onChange={handleChange}
            className="border rounded w-full px-3 py-2"
          />
          <input
            name="region"
            placeholder="ì§€??
            value={form.region}
            onChange={handleChange}
            className="border rounded w-full px-3 py-2"
          />
          <textarea
            name="intro"
            placeholder="?€ ?Œê°œ"
            value={form.intro}
            onChange={handleChange}
            className="border rounded w-full px-3 py-2"
            rows={4}
          />
          <input
            name="image"
            placeholder="?´ë?ì§€ URL (? íƒ)"
            value={form.image}
            onChange={handleChange}
            className="border rounded w-full px-3 py-2"
          />

          <button
            onClick={handleGenerate}
            disabled={isCreating}
            className="bg-blue-500 text-white px-4 py-2 rounded w-full disabled:bg-gray-400"
          >
            {isCreating ? "?€ ?ì„± ì¤?.." : "?€ ?ì„± ë°?ë¸”ë¡œê·??ë™ ?ì„±"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-green-800 mb-2">???€ ?ì„± ?„ë£Œ!</h2>
            <p className="text-green-700">
              <strong>{generated.teamName}</strong> ?€???±ê³µ?ìœ¼ë¡??ì„±?˜ì—ˆ?µë‹ˆ??
            </p>
            <p className="text-sm text-green-600 mt-1">
              ?€ ID: {teamId}
            </p>
          </div>

          <h2 className="text-xl font-semibold">?ì„±??ë¸”ë¡œê·?/h2>
          <PostCard
            id="auto"
            title={`${generated.teamName} ê³µì‹ ë¸”ë¡œê·?}
            content={generated.autoPost ?? ""}
            initialLikes={0}
            initialViews={0}
          />

          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/teams/${teamId}/post-detail`)}
              className="bg-purple-500 text-white px-4 py-2 rounded flex-1"
            >
              ?“– ë¸”ë¡œê·??ì„¸ ë³´ê¸°
            </button>
            <button
              onClick={goToTeamManagement}
              className="bg-green-500 text-white px-4 py-2 rounded flex-1"
            >
              ?† ?€ ê´€ë¦??€?œë³´??            </button>
            <button
              onClick={() => navigate("/blogs")}
              className="bg-blue-500 text-white px-4 py-2 rounded flex-1"
            >
              ?“ ë¸”ë¡œê·?ëª©ë¡
            </button>
            <button
              onClick={() => {
                setGenerated(null);
                setTeamId(null);
                setForm({ teamName: "", region: "", intro: "", image: "" });
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded flex-1"
            >
              ???€ ?ì„±
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
