import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Meetup {
  id: string;
  title: string;
  date: string;
  place: string;
  capacity: number;
  members: string[];
  status: "open" | "closed" | "hidden";
  hostUid: string;
  createdAt: any;
}

export default function MeetupsPage() {
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetups = async () => {
      try {
        const q = query(
          collection(db, "meetups"),
          orderBy("createdAt", "desc"),
          limit(20)
        );
        const snapshot = await getDocs(q);
        const meetupsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Meetup[];
        setMeetups(meetupsData);
      } catch (error) {
        console.error("Error fetching meetups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetups();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">모임</h1>
        <div className="text-center py-8">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">모임</h1>
        <Link
          to="/meetups/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          모임 만들기
        </Link>
      </div>

      <div className="space-y-4">
        {meetups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            아직 등록된 모임이 없습니다.
          </div>
        ) : (
          meetups.map((meetup) => (
            <div
              key={meetup.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{meetup.title}</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📅 {meetup.date}</p>
                    <p>📍 {meetup.place}</p>
                    <p>👥 {meetup.members.length}/{meetup.capacity}명</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      meetup.status === "open"
                        ? "bg-green-100 text-green-800"
                        : meetup.status === "closed"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {meetup.status === "open" ? "모집중" : 
                     meetup.status === "closed" ? "마감" : "숨김"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
