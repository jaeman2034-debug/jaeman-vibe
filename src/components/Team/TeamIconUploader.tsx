import { useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { storage, db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

type Props = {
  teamId: string;
  currentIconUrl?: string;
  admins?: string[];
};

export default function TeamIconUploader({ teamId, currentIconUrl, admins = [] }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentIconUrl ?? null);
  const { user } = useAuth();
  const isAdmin = !!user && admins.includes(user.uid);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAdmin) {
      alert("관리자�??�이콘을 변경할 ???�습?�다.");
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `teams/${teamId}/icon.png`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "teams", teamId), {
        iconUrl: url,
        updatedAt: Date.now(),
      });

      setPreview(url);
    } catch (err) {
      console.error("?�이�??�로???�패:", err);
      alert("?�이�??�로??�??�류가 발생?�습?�다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      {preview ? (
        <img
          src={preview}
          alt="Team Icon"
          className="w-16 h-16 rounded-full object-cover border"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-xs text-gray-500">No Icon</span>
        </div>
      )}
      {isAdmin && (
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={handleFileChange}
        />
      )}
    </div>
  );
}


