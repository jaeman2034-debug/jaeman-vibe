// ?�� ?�스?�용 ?�플 ?�품 ?�이???�성 ?�크립트
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

const createSampleProducts = async () => {
  const sampleProducts = [
    {
      title: "?�이??축구???�레?�터",
      desc: "?�이�?270, ?�태 ?�호, 3개월 ?�용",
      price: 45000,
      category: "축구",
      condition: "중고",
      location: "?�울 강남�?,
      imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400",
      createdAt: serverTimestamp(),
    },
    {
      title: "?�디?�스 ?�구??,
      desc: "?�이�?280, ?�것, 미착??,
      price: 89000,
      category: "?�구", 
      condition: "?�것",
      location: "경기???�남??,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
      createdAt: serverTimestamp(),
    },
    {
      title: "?�슨 ?�니???�켓",
      desc: "?�로 ?�탭 모델, 그립 ?�로 교체",
      price: 120000,
      category: "?�니??,
      condition: "거의 ?�것", 
      location: "?�천 ?�수�?,
      imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400",
      createdAt: serverTimestamp(),
    }
  ];

  try {
    for (const product of sampleProducts) {
      const docRef = await addDoc(collection(db, "marketItems"), product);
      console.log("???�플 ?�품 ?�성??", docRef.id, product.title);
    }
    console.log("?�� 모든 ?�플 ?�품 ?�성 ?�료!");
  } catch (error) {
    console.error("???�플 ?�품 ?�성 ?�패:", error);
  }
};

// 브라?��? 콘솔?�서 ?�행?????�도�??�역 ?�수�??�록
(window as any).createSampleProducts = createSampleProducts;

export default createSampleProducts;
