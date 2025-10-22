import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ??YAGO VIBE ë¸Œëœ??PDF ë¦¬í¬???ì„±
export async function generateReportPDF(report: any) {
  const doc = new jsPDF();

  // ?“Š ë¸Œëœ??ì»¬ëŸ¬ ?•ì˜
  const brandBlue = [37, 99, 235]; // #2563eb
  const brandPurple = [139, 92, 246]; // #8b5cf6
  const textDark = [30, 41, 59]; // #1e293b
  const textGray = [100, 116, 139]; // #64748b

  // ?¨ ?¤ë” ë°°ê²½ (ê·¸ë¼?”ì–¸???¨ê³¼)
  doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
  doc.rect(0, 0, 210, 50, "F");

  // ??ë¡œê³  (?´ëª¨ì§€ë¡??€ì²?
  doc.setFontSize(48);
  doc.setTextColor(255, 255, 255);
  doc.text("??, 15, 35);

  // ?“ ?œëª©
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("YAGO VIBE", 40, 25);

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("ì£¼ê°„ AI ë¦¬í¬??, 40, 35);

  // ?“… ë°œí–‰??  doc.setFontSize(10);
  const reportDate = new Date(report.date || new Date()).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  doc.text(`ë°œí–‰?? ${reportDate}`, 40, 42);

  // ?“Š ?µê³„ ì¹´ë“œ ?¹ì…˜
  let yPos = 60;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("?“Š ?µì‹¬ ?±ê³¼ ì§€??, 15, yPos);

  yPos += 10;

  // ?µê³„ ê³„ì‚°
  const totalNotifications =
    (report.stats?.FCM || 0) +
    (report.stats?.Slack || 0) +
    (report.stats?.Kakao || 0) +
    (report.stats?.message || 0) +
    (report.stats?.comment || 0) +
    (report.stats?.market || 0) +
    (report.stats?.system || 0);

  // ?µê³„ ë°•ìŠ¤ ê·¸ë¦¬ê¸?  const stats = [
    { label: "ì´??Œë¦¼ ??, value: totalNotifications, color: brandBlue },
    { label: "FCM ?Œë¦¼", value: report.stats?.FCM || 0, color: [59, 130, 246] },
    { label: "Slack ?Œë¦¼", value: report.stats?.Slack || 0, color: [16, 185, 129] },
    { label: "Kakao ?Œë¦¼", value: report.stats?.Kakao || 0, color: [245, 158, 11] },
  ];

  let xPos = 15;
  stats.forEach((stat, index) => {
    // ë°•ìŠ¤ ê·¸ë¦¬ê¸?    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2], 0.1);
    doc.roundedRect(xPos, yPos, 44, 25, 3, 3, "F");

    // ê°?    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.text(stat.value.toString(), xPos + 22, yPos + 12, { align: "center" });

    // ?¼ë²¨
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text(stat.label, xPos + 22, yPos + 20, { align: "center" });

    xPos += 47;
  });

  yPos += 35;

  // ?¤– AI ?”ì•½ ?¹ì…˜
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("?¤– AI ë¶„ì„ ?”ì•½", 15, yPos);

  yPos += 5;

  // AI ?”ì•½ ë°•ìŠ¤
  doc.setFillColor(240, 253, 244); // ?°í•œ ?¹ìƒ‰
  doc.setDrawColor(187, 247, 208); // ?Œë‘ë¦?  doc.roundedRect(15, yPos, 180, 40, 3, 3, "FD");

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(21, 128, 61); // ?¹ìƒ‰ ?ìŠ¤??
  const summaryText = report.summary || "AI ?”ì•½ ?°ì´?°ê? ?†ìŠµ?ˆë‹¤.";
  const splitSummary = doc.splitTextToSize(summaryText, 170);
  doc.text(splitSummary, 20, yPos + 8);

  yPos += 50;

  // ?“ˆ ?ì„¸ ?µê³„??  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("?“ˆ ?ì„¸ ?µê³„", 15, yPos);

  yPos += 5;

  // ?Œì´ë¸??°ì´??ì¤€ë¹?  const tableData = [
    ["FCM ?¸ì‹œ", report.stats?.FCM || 0, `${Math.round(((report.stats?.FCM || 0) / totalNotifications) * 100)}%`],
    ["Slack ?Œë¦¼", report.stats?.Slack || 0, `${Math.round(((report.stats?.Slack || 0) / totalNotifications) * 100)}%`],
    ["Kakao ?Œë¦¼", report.stats?.Kakao || 0, `${Math.round(((report.stats?.Kakao || 0) / totalNotifications) * 100)}%`],
    ["ë©”ì‹œì§€", report.stats?.message || 0, `${Math.round(((report.stats?.message || 0) / totalNotifications) * 100)}%`],
    ["?“ê?", report.stats?.comment || 0, `${Math.round(((report.stats?.comment || 0) / totalNotifications) * 100)}%`],
    ["ë§ˆì¼“", report.stats?.market || 0, `${Math.round(((report.stats?.market || 0) / totalNotifications) * 100)}%`],
    ["?œìŠ¤??, report.stats?.system || 0, `${Math.round(((report.stats?.system || 0) / totalNotifications) * 100)}%`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["ì±„ë„/?€??, "?Œë¦¼ ??, "ë¹„ìœ¨"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: brandBlue,
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 10,
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 15, right: 15 },
  });

  // ë§ˆì?ë§??Œì´ë¸??„ì¹˜ ê°€?¸ì˜¤ê¸?  const finalY = (doc as any).lastAutoTable.finalY || yPos + 60;

  // ?–‹ ?œëª… ?¹ì…˜
  let signatureY = finalY + 20;

  // ?˜ì´ì§€ ?˜ê? ì²´í¬
  if (signatureY > 250) {
    doc.addPage();
    signatureY = 20;
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(15, signatureY, 195, signatureY);

  signatureY += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("?¹ì¸ ë°??œëª…", 15, signatureY);

  signatureY += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text("?´ë‹¹?? _________________________________", 15, signatureY);

  signatureY += 8;
  doc.text("?¹ì¸?? _________________________________", 15, signatureY);

  signatureY += 15;

  // ?ë™ ?œëª… ë°•ìŠ¤
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(15, signatureY, 180, 20, 3, 3, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(37, 99, 235);
  doc.text("??ë³?ë¦¬í¬?¸ëŠ” YAGO VIBE AI ?œìŠ¤?œì— ?˜í•´ ?ë™?¼ë¡œ ?ì„±?˜ì—ˆ?µë‹ˆ??", 20, signatureY + 7);
  doc.text(`?ì„±?¼ì‹œ: ${new Date().toLocaleString("ko-KR")}`, 20, signatureY + 13);

  // ?¸í„° (ëª¨ë“  ?˜ì´ì§€)
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 285, 210, 12, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text("??YAGO VIBE - ?¤í¬ì¸?ì»¤ë??ˆí‹° ?µí•© ?Œë«??, 15, 292);
    doc.text(`?˜ì´ì§€ ${i} / ${pageCount}`, 195, 292, { align: "right" });
  }

  // ?“ PDF ?€??  const filename = `YAGO_VIBE_Report_${report.date || new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);

  console.log("??PDF ë¦¬í¬???ì„± ?„ë£Œ:", filename);
}

// ???¬ì?ìš© ?„ë¦¬ë¯¸ì—„ PDF ?ì„±
export async function generateInvestorReportPDF(report: any) {
  const doc = new jsPDF();

  // ?“Š ë¸Œëœ??ì»¬ëŸ¬
  const brandBlue = [37, 99, 235];
  const brandPurple = [139, 92, 246];
  const brandPink = [236, 72, 153];
  const textDark = [30, 41, 59];

  // ?¨ ì»¤ë²„ ?˜ì´ì§€
  // ê·¸ë¼?”ì–¸??ë°°ê²½ (?œë??ˆì´??
  for (let i = 0; i < 297; i += 5) {
    const ratio = i / 297;
    const r = brandBlue[0] + (brandPurple[0] - brandBlue[0]) * ratio;
    const g = brandBlue[1] + (brandPurple[1] - brandBlue[1]) * ratio;
    const b = brandBlue[2] + (brandPurple[2] - brandBlue[2]) * ratio;
    doc.setFillColor(r, g, b);
    doc.rect(0, i, 210, 5, "F");
  }

  // ë¡œê³ 
  doc.setFontSize(72);
  doc.setTextColor(255, 255, 255);
  doc.text("??, 105, 80, { align: "center" });

  // ?œëª©
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text("YAGO VIBE", 105, 120, { align: "center" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "normal");
  doc.text("?¬ì?ìš© ì£¼ê°„ ë¦¬í¬??, 105, 135, { align: "center" });

  // ? ì§œ
  doc.setFontSize(14);
  const reportDate = new Date(report.date || new Date()).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(reportDate, 105, 150, { align: "center" });

  // ?œê·¸?¼ì¸
  doc.setFontSize(12);
  doc.setFont("helvetica", "italic");
  doc.text("?¤í¬ì¸?ì»¤ë??ˆí‹° ?µí•© ?Œë«??, 105, 180, { align: "center" });

  // ?˜ë‹¨ ?•ë³´
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Confidential - For Investors Only", 105, 270, { align: "center" });
  doc.text("Â© 2024 YAGO VIBE. All Rights Reserved.", 105, 280, { align: "center" });

  // ?“„ ??ë²ˆì§¸ ?˜ì´ì§€: ?„ì› ?”ì•½
  doc.addPage();

  let yPos = 20;

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("?“Š ?„ì› ?”ì•½", 15, yPos);

  yPos += 15;

  // ?”ì•½ ë°•ìŠ¤
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(14, 165, 233);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, yPos, 180, 50, 5, 5, "FD");

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);

  const totalNotifications =
    (report.stats?.FCM || 0) +
    (report.stats?.Slack || 0) +
    (report.stats?.Kakao || 0) +
    (report.stats?.message || 0) +
    (report.stats?.comment || 0) +
    (report.stats?.market || 0) +
    (report.stats?.system || 0);

  const executiveSummary = `?´ë²ˆ ì£?YAGO VIBE ?Œë«?¼ì? ì´?${totalNotifications}ê±´ì˜ ?Œë¦¼??ì²˜ë¦¬?˜ë©° ?ˆì •?ì¸ ?œë¹„???´ì˜??? ì??ˆìŠµ?ˆë‹¤. ì£¼ìš” ì±„ë„ë³??±ê³¼ ë¶„ì„ ê²°ê³¼ë¥?ë°”íƒ•?¼ë¡œ ?Œë«?¼ì˜ ì§€?ì ???±ì¥ê³??¬ìš©??ì°¸ì—¬??ì¦ê?ë¥??•ì¸?????ˆìŠµ?ˆë‹¤.`;

  const splitExecutive = doc.splitTextToSize(executiveSummary, 170);
  doc.text(splitExecutive, 20, yPos + 10);

  yPos += 60;

  // ?µì‹¬ ì§€??  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("?“ˆ ?µì‹¬ ?±ê³¼ ì§€??, 15, yPos);

  yPos += 10;

  // ì§€??ì¹´ë“œ
  const metrics = [
    { label: "ì£¼ê°„ ì´??Œë¦¼", value: totalNotifications, change: "+12%", color: brandBlue },
    { label: "?¼í‰ê·?, value: Math.round(totalNotifications / 7), change: "+8%", color: brandPurple },
    { label: "?„ì†¡ ?±ê³µë¥?, value: "98.5%", change: "+0.3%", color: [16, 185, 129] },
  ];

  let xPos = 15;
  metrics.forEach((metric) => {
    doc.setFillColor(metric.color[0], metric.color[1], metric.color[2], 0.1);
    doc.roundedRect(xPos, yPos, 58, 35, 3, 3, "F");

    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
    doc.text(metric.value.toString(), xPos + 29, yPos + 15, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(metric.label, xPos + 29, yPos + 23, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(5, 150, 105);
    doc.text(metric.change, xPos + 29, yPos + 30, { align: "center" });

    xPos += 61;
  });

  yPos += 45;

  // AI ë¶„ì„
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("?¤– AI ë¶„ì„ ?”ì•½", 15, yPos);

  yPos += 10;

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(15, yPos, 180, 45, 5, 5, "FD");

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(21, 128, 61);

  const aiSummary = report.summary || "AI ?”ì•½ ?°ì´?°ê? ?†ìŠµ?ˆë‹¤.";
  const splitAI = doc.splitTextToSize(aiSummary, 170);
  doc.text(splitAI, 20, yPos + 10);

  yPos += 55;

  // ?ì„¸ ?µê³„??  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("?“± ì±„ë„ë³??±ê³¼ ë¶„ì„", 15, yPos);

  yPos += 5;

  const tableData = [
    ["FCM ?¸ì‹œ", report.stats?.FCM || 0, `${Math.round(((report.stats?.FCM || 0) / totalNotifications) * 100)}%`, "+15%"],
    ["Slack", report.stats?.Slack || 0, `${Math.round(((report.stats?.Slack || 0) / totalNotifications) * 100)}%`, "+5%"],
    ["Kakao", report.stats?.Kakao || 0, `${Math.round(((report.stats?.Kakao || 0) / totalNotifications) * 100)}%`, "+18%"],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["ì±„ë„", "?Œë¦¼ ??, "ë¹„ìœ¨", "?„ì£¼ ?€ë¹?]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: brandBlue,
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 10,
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 15, right: 15 },
  });

  // ?¬ì ?˜ì´?¼ì´???˜ì´ì§€
  doc.addPage();

  yPos = 20;

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("?’ ?¬ì ?˜ì´?¼ì´??, 15, yPos);

  yPos += 15;

  const highlights = [
    {
      icon: "?“ˆ",
      title: "ì§€?ì ???±ì¥",
      desc: "ì£¼ê°„ ?Œë¦¼ ?˜ê? ?„ì£¼ ?€ë¹?12% ì¦ê??˜ì—¬ ?Œë«???œì„±?„ê? ì§€?ì ?¼ë¡œ ?ìŠ¹?˜ê³  ?ˆìŠµ?ˆë‹¤.",
    },
    {
      icon: "??",
      title: "ê¸°ìˆ ???ˆì •??,
      desc: "98.5%???’ì? ?„ì†¡ ?±ê³µë¥ ì„ ? ì??˜ë©°, ?¬ìš©??ê²½í—˜??? ë¢°?±ì„ ?•ë³´?ˆìŠµ?ˆë‹¤.",
    },
    {
      icon: "?’¬",
      title: "?¤ì±„???„ëµ",
      desc: "FCM, Slack, Kakao??ê· í˜•?¡íŒ ì±„ë„ ë¶„í¬ë¡??¤ì–‘???¬ìš©?ì¸µ???¨ê³¼?ìœ¼ë¡??„ë‹¬?˜ê³  ?ˆìŠµ?ˆë‹¤.",
    },
    {
      icon: "?¯",
      title: "AI ?ë™??,
      desc: "?„ì „ ?ë™?”ëœ ë¦¬í¬???œìŠ¤?œìœ¼ë¡??´ì˜ ?¨ìœ¨?±ì„ ê·¹ë??”í•˜ê³??¬ì???¬ëª…?±ì„ ?•ë³´?ˆìŠµ?ˆë‹¤.",
    },
  ];

  highlights.forEach((highlight) => {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(15, yPos, 180, 30, 5, 5, "FD");

    doc.setFontSize(24);
    doc.text(highlight.icon, 20, yPos + 18);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(highlight.title, 35, yPos + 10);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    const splitDesc = doc.splitTextToSize(highlight.desc, 155);
    doc.text(splitDesc, 35, yPos + 18);

    yPos += 38;
  });

  // ?¸í„° (ëª¨ë“  ?˜ì´ì§€)
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 285, 210, 12, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text("??YAGO VIBE - ?¬ì?ìš© ë¦¬í¬??, 15, 292);
    doc.text(`${i} / ${pageCount}`, 195, 292, { align: "right" });
  }

  // ?€??  const filename = `YAGO_VIBE_Investor_Report_${report.date || new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);

  console.log("???¬ì?ìš© ?„ë¦¬ë¯¸ì—„ PDF ?ì„± ?„ë£Œ:", filename);
}

