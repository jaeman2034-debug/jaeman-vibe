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
      alert("?��? 지?? ?�개�?모두 ?�력?�주?�요.");
      return;
    }

    setIsCreating(true);
    
    try {
      // ?�� ?�제 구현: ?� 문서 ?�성
      const teamDoc = await addDoc(collection(db, "teams"), {
        name: form.teamName,
        region: form.region,
        intro: form.intro,
        image: form.image,
        createdAt: new Date(),
        status: "active",
      });

      setTeamId(teamDoc.id);

      // ?�동 블로�??�스???�성
      const autoPost = `${form.teamName}??${form.region}?�서 ?�동?�는 ?�?�니?? 
${form.intro} 

많�? 분들�??�께 즐겁�??�동?�고 ?�습?�다!
?�??관?�이 ?�으?�면 ?�제???�락주세??`;

      setGenerated({ ...form, autoPost });

      // 블로�??�스?�도 ?�동 ?�성
      await addDoc(collection(db, "blogs"), {
        title: `${form.teamName} 공식 블로�?,
        content: autoPost,
        author: "system",
        authorName: form.teamName,
        teamId: teamDoc.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    } catch (error) {
      console.error("?� ?�성 ?�류:", error);
      alert("?� ?�성 �??�류가 발생?�습?�다.");
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
      <h1 className="text-2xl font-bold mb-4">?� 블로�??�동 ?�성�?/h1>

      {!generated ? (
        <div className="space-y-3">
          <input
            name="teamName"
            placeholder="?� ?�름"
            value={form.teamName}
            onChange={handleChange}
            className="border rounded w-full px-3 py-2"
          />
          <input
            name="region"
            placeholder="지??
            value={form.region}
            onChange={handleChange}
            className="border rounded w-full px-3 py-2"
          />
          <textarea
            name="intro"
            placeholder="?� ?�개"
            value={form.intro}
            onChange={handleChange}
            className="border rounded w-full px-3 py-2"
            rows={4}
          />
          <input
            name="image"
            placeholder="?��?지 URL (?�택)"
            value={form.image}
            onChange={handleChange}
            className="border rounded w-full px-3 py-2"
          />

          <button
            onClick={handleGenerate}
            disabled={isCreating}
            className="bg-blue-500 text-white px-4 py-2 rounded w-full disabled:bg-gray-400"
          >
            {isCreating ? "?� ?�성 �?.." : "?� ?�성 �?블로�??�동 ?�성"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-green-800 mb-2">???� ?�성 ?�료!</h2>
            <p className="text-green-700">
              <strong>{generated.teamName}</strong> ?�???�공?�으�??�성?�었?�니??
            </p>
            <p className="text-sm text-green-600 mt-1">
              ?� ID: {teamId}
            </p>
          </div>

          <h2 className="text-xl font-semibold">?�성??블로�?/h2>
          <PostCard
            id="auto"
            title={`${generated.teamName} 공식 블로�?}
            content={generated.autoPost ?? ""}
            initialLikes={0}
            initialViews={0}
          />

          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/teams/${teamId}/post-detail`)}
              className="bg-purple-500 text-white px-4 py-2 rounded flex-1"
            >
              ?�� 블로�??�세 보기
            </button>
            <button
              onClick={goToTeamManagement}
              className="bg-green-500 text-white px-4 py-2 rounded flex-1"
            >
              ?�� ?� 관�??�?�보??            </button>
            <button
              onClick={() => navigate("/blogs")}
              className="bg-blue-500 text-white px-4 py-2 rounded flex-1"
            >
              ?�� 블로�?목록
            </button>
            <button
              onClick={() => {
                setGenerated(null);
                setTeamId(null);
                setForm({ teamName: "", region: "", intro: "", image: "" });
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded flex-1"
            >
              ???� ?�성
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
