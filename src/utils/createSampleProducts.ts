// ?§ª ?ŒìŠ¤?¸ìš© ?˜í”Œ ?í’ˆ ?°ì´???ì„± ?¤í¬ë¦½íŠ¸
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

const createSampleProducts = async () => {
  const sampleProducts = [
    {
      title: "?˜ì´??ì¶•êµ¬???„ë ˆ?°í„°",
      desc: "?¬ì´ì¦?270, ?íƒœ ?‘í˜¸, 3ê°œì›” ?¬ìš©",
      price: 45000,
      category: "ì¶•êµ¬",
      condition: "ì¤‘ê³ ",
      location: "?œìš¸ ê°•ë‚¨êµ?,
      imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400",
      createdAt: serverTimestamp(),
    },
    {
      title: "?„ë””?¤ìŠ¤ ?êµ¬??,
      desc: "?¬ì´ì¦?280, ?ˆê²ƒ, ë¯¸ì°©??,
      price: 89000,
      category: "?êµ¬", 
      condition: "?ˆê²ƒ",
      location: "ê²½ê¸°???±ë‚¨??,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
      createdAt: serverTimestamp(),
    },
    {
      title: "?ŒìŠ¨ ?Œë‹ˆ???¼ì¼“",
      desc: "?„ë¡œ ?¤íƒ­ ëª¨ë¸, ê·¸ë¦½ ?ˆë¡œ êµì²´",
      price: 120000,
      category: "?Œë‹ˆ??,
      condition: "ê±°ì˜ ?ˆê²ƒ", 
      location: "?¸ì²œ ?°ìˆ˜êµ?,
      imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400",
      createdAt: serverTimestamp(),
    }
  ];

  try {
    for (const product of sampleProducts) {
      const docRef = await addDoc(collection(db, "marketItems"), product);
      console.log("???˜í”Œ ?í’ˆ ?ì„±??", docRef.id, product.title);
    }
    console.log("?‰ ëª¨ë“  ?˜í”Œ ?í’ˆ ?ì„± ?„ë£Œ!");
  } catch (error) {
    console.error("???˜í”Œ ?í’ˆ ?ì„± ?¤íŒ¨:", error);
  }
};

// ë¸Œë¼?°ì? ì½˜ì†”?ì„œ ?¤í–‰?????ˆë„ë¡??„ì—­ ?¨ìˆ˜ë¡??±ë¡
(window as any).createSampleProducts = createSampleProducts;

export default createSampleProducts;
