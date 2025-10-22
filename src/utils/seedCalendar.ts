import { createSchedule } from "../lib/firestore-calendar";

/**
 * ?ŒìŠ¤???°ì´???œë“œ
 * ì½˜ì†”?ì„œ seedDemoSchedules() ?¤í–‰
 */
export async function seedDemoSchedules() {
  const base = new Date();
  base.setHours(10, 0, 0, 0);

  console.log("?“… ìº˜ë¦°???ŒìŠ¤???°ì´???ì„± ì¤?..");

  // 1. ?Œí˜FC 60 ?ˆë ¨
  await createSchedule({
    title: "?Œí˜FC60 ?•ê¸° ?ˆë ¨",
    allDay: false,
    start: base,
    end: new Date(base.getTime() + 2 * 60 * 60 * 1000),
    type: "team",
    location: "?¬ì²œì¢…í•©?´ë™??,
    description: "ì£¼ê°„ ?•ê¸° ?ˆë ¨\nì°¸ì„ ?„ìˆ˜!",
    createdBy: "system",
    color: "#3b82f6",
    teamId: "soheul60",
  });

  // 2. U-12 ?„ì¹´?°ë? ?ˆìŠ¨
  await createSchedule({
    title: "U-12 ?„ì¹´?°ë? ?ˆìŠ¨",
    allDay: false,
    start: new Date(base.getTime() + 24 * 60 * 60 * 1000),
    end: new Date(base.getTime() + 26 * 60 * 60 * 1000),
    type: "academy",
    location: "?Œí˜êµ¬ì¥ A",
    description: "? ì†Œ??ì¶•êµ¬ ê¸°ì´ˆ ?ˆë ¨",
    createdBy: "system",
    color: "#8b5cf6",
    teamId: "academy",
  });

  // 3. ëª¨ë¹„?¤ë°° ?ˆì„ 
  await createSchedule({
    title: "ëª¨ë¹„?¤ë°° ?ˆì„  1ì°¨ì „",
    allDay: true,
    start: new Date(base.getTime() + 3 * 24 * 60 * 60 * 1000),
    end: new Date(base.getTime() + 4 * 24 * 60 * 60 * 1000),
    type: "tournament",
    location: "?¬ì²œB ì¢…í•©?´ë™??,
    description: "ëª¨ë¹„?¤ë°° ? ë„ˆë¨¼íŠ¸ ?ˆì„ ??,
    createdBy: "system",
    color: "#f59e0b",
  });

  // 4. ?Œí˜FC 88 ì¹œì„  ê²½ê¸°
  await createSchedule({
    title: "?Œí˜FC88 vs 60 ì¹œì„ ê²½ê¸°",
    allDay: false,
    start: new Date(base.getTime() + 5 * 24 * 60 * 60 * 1000),
    end: new Date(base.getTime() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    type: "team",
    location: "?Œí˜ ì²´ìœ¡ê³µì›",
    description: "ì¹œì„  ê²½ê¸°\n?°ì²œ ??ì·¨ì†Œ",
    createdBy: "system",
    color: "#3b82f6",
    teamId: "soheul88",
  });

  // 5. ?„ì¹´?°ë? ?™ë?ëª?ë¯¸íŒ…
  await createSchedule({
    title: "?„ì¹´?°ë? ?™ë?ëª?ê°„ë‹´??,
    allDay: false,
    start: new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000),
    end: new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000),
    type: "academy",
    location: "?Œí˜ ì»¤ë??ˆí‹°?¼í„°",
    description: "?™ë?ëª?ë¯¸íŒ… ë°??œì¦Œ ê³„íš ?¤ëª…",
    createdBy: "system",
    color: "#8b5cf6",
    teamId: "academy",
  });

  console.log("??ìº˜ë¦°???ŒìŠ¤???°ì´???ì„± ?„ë£Œ!");
  console.log("?”„ ?˜ì´ì§€ë¥??ˆë¡œê³ ì¹¨?˜ì„¸??");
}

// ë¸Œë¼?°ì? ì½˜ì†”?ì„œ ?¬ìš© ê°€?¥í•˜?„ë¡ ?„ì—­ ?±ë¡
if (typeof window !== "undefined") {
  (window as any).seedDemoSchedules = seedDemoSchedules;
}

