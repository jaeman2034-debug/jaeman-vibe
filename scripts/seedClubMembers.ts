import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

// Firebase 설정 (환경에 맞게 수정)
const firebaseConfig = {
  // 실제 Firebase 설정으로 교체
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 클럽 멤버 시드 데이터 생성
async function seedClubMembers() {
  const clubId = "your-club-id"; // 실제 클럽 ID로 교체
  
  const members = [
    {
      userId: "user1",
      userName: "김축구",
      role: "member",
      joinedAt: new Date("2024-01-01"),
      paidUntil: "2025-10",
      totalPaid: 200000,
      duesHistory: [
        {
          month: "2025-10",
          amount: 20000,
          paidAt: new Date("2025-10-01")
        },
        {
          month: "2025-09",
          amount: 20000,
          paidAt: new Date("2025-09-01")
        }
      ],
      attendance: 15,
      position: "공격수",
      phone: "010-1234-5678",
      age: 25
    },
    {
      userId: "user2",
      userName: "박골키퍼",
      role: "member",
      joinedAt: new Date("2024-02-01"),
      paidUntil: "2025-09", // 미납 상태
      totalPaid: 180000,
      duesHistory: [
        {
          month: "2025-09",
          amount: 20000,
          paidAt: new Date("2025-09-01")
        },
        {
          month: "2025-08",
          amount: 20000,
          paidAt: new Date("2025-08-01")
        }
      ],
      attendance: 12,
      position: "골키퍼",
      phone: "010-2345-6789",
      age: 28
    },
    {
      userId: "user3",
      userName: "이미드필더",
      role: "admin",
      joinedAt: new Date("2024-03-01"),
      paidUntil: "2025-10",
      totalPaid: 160000,
      duesHistory: [
        {
          month: "2025-10",
          amount: 20000,
          paidAt: new Date("2025-10-01")
        },
        {
          month: "2025-09",
          amount: 20000,
          paidAt: new Date("2025-09-01")
        }
      ],
      attendance: 18,
      position: "미드필더",
      phone: "010-3456-7890",
      age: 23
    },
    {
      userId: "user4",
      userName: "최디펜더",
      role: "member",
      joinedAt: new Date("2024-04-01"),
      paidUntil: "", // 미납 상태
      totalPaid: 0,
      duesHistory: [],
      attendance: 8,
      position: "디펜더",
      phone: "010-4567-8901",
      age: 30
    }
  ];

  try {
    for (const member of members) {
      const memberRef = await addDoc(collection(db, "clubs", clubId, "members"), member);
      console.log(`회원 추가 완료: ${member.userName} (ID: ${memberRef.id})`);
    }
    
    console.log("모든 회원 데이터 시드 완료! 🎉");
  } catch (error) {
    console.error("회원 데이터 시드 실패:", error);
  }
}

// 실행
seedClubMembers();
