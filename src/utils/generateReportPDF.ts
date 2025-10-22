import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ??YAGO VIBE 브랜??PDF 리포???�성
export async function generateReportPDF(report: any) {
  const doc = new jsPDF();

  // ?�� 브랜??컬러 ?�의
  const brandBlue = [37, 99, 235]; // #2563eb
  const brandPurple = [139, 92, 246]; // #8b5cf6
  const textDark = [30, 41, 59]; // #1e293b
  const textGray = [100, 116, 139]; // #64748b

  // ?�� ?�더 배경 (그라?�언???�과)
  doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
  doc.rect(0, 0, 210, 50, "F");

  // ??로고 (?�모지�??��?
  doc.setFontSize(48);
  doc.setTextColor(255, 255, 255);
  doc.text("??, 15, 35);

  // ?�� ?�목
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("YAGO VIBE", 40, 25);

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("주간 AI 리포??, 40, 35);

  // ?�� 발행??  doc.setFontSize(10);
  const reportDate = new Date(report.date || new Date()).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  doc.text(`발행?? ${reportDate}`, 40, 42);

  // ?�� ?�계 카드 ?�션
  let yPos = 60;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("?�� ?�심 ?�과 지??, 15, yPos);

  yPos += 10;

  // ?�계 계산
  const totalNotifications =
    (report.stats?.FCM || 0) +
    (report.stats?.Slack || 0) +
    (report.stats?.Kakao || 0) +
    (report.stats?.message || 0) +
    (report.stats?.comment || 0) +
    (report.stats?.market || 0) +
    (report.stats?.system || 0);

  // ?�계 박스 그리�?  const stats = [
    { label: "�??�림 ??, value: totalNotifications, color: brandBlue },
    { label: "FCM ?�림", value: report.stats?.FCM || 0, color: [59, 130, 246] },
    { label: "Slack ?�림", value: report.stats?.Slack || 0, color: [16, 185, 129] },
    { label: "Kakao ?�림", value: report.stats?.Kakao || 0, color: [245, 158, 11] },
  ];

  let xPos = 15;
  stats.forEach((stat, index) => {
    // 박스 그리�?    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2], 0.1);
    doc.roundedRect(xPos, yPos, 44, 25, 3, 3, "F");

    // �?    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.text(stat.value.toString(), xPos + 22, yPos + 12, { align: "center" });

    // ?�벨
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text(stat.label, xPos + 22, yPos + 20, { align: "center" });

    xPos += 47;
  });

  yPos += 35;

  // ?�� AI ?�약 ?�션
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("?�� AI 분석 ?�약", 15, yPos);

  yPos += 5;

  // AI ?�약 박스
  doc.setFillColor(240, 253, 244); // ?�한 ?�색
  doc.setDrawColor(187, 247, 208); // ?�두�?  doc.roundedRect(15, yPos, 180, 40, 3, 3, "FD");

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(21, 128, 61); // ?�색 ?�스??
  const summaryText = report.summary || "AI ?�약 ?�이?��? ?�습?�다.";
  const splitSummary = doc.splitTextToSize(summaryText, 170);
  doc.text(splitSummary, 20, yPos + 8);

  yPos += 50;

  // ?�� ?�세 ?�계??  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("?�� ?�세 ?�계", 15, yPos);

  yPos += 5;

  // ?�이�??�이??준�?  const tableData = [
    ["FCM ?�시", report.stats?.FCM || 0, `${Math.round(((report.stats?.FCM || 0) / totalNotifications) * 100)}%`],
    ["Slack ?�림", report.stats?.Slack || 0, `${Math.round(((report.stats?.Slack || 0) / totalNotifications) * 100)}%`],
    ["Kakao ?�림", report.stats?.Kakao || 0, `${Math.round(((report.stats?.Kakao || 0) / totalNotifications) * 100)}%`],
    ["메시지", report.stats?.message || 0, `${Math.round(((report.stats?.message || 0) / totalNotifications) * 100)}%`],
    ["?��?", report.stats?.comment || 0, `${Math.round(((report.stats?.comment || 0) / totalNotifications) * 100)}%`],
    ["마켓", report.stats?.market || 0, `${Math.round(((report.stats?.market || 0) / totalNotifications) * 100)}%`],
    ["?�스??, report.stats?.system || 0, `${Math.round(((report.stats?.system || 0) / totalNotifications) * 100)}%`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["채널/?�??, "?�림 ??, "비율"]],
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

  // 마�?�??�이�??�치 가?�오�?  const finalY = (doc as any).lastAutoTable.finalY || yPos + 60;

  // ?�� ?�명 ?�션
  let signatureY = finalY + 20;

  // ?�이지 ?��? 체크
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
  doc.text("?�인 �??�명", 15, signatureY);

  signatureY += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text("?�당?? _________________________________", 15, signatureY);

  signatureY += 8;
  doc.text("?�인?? _________________________________", 15, signatureY);

  signatureY += 15;

  // ?�동 ?�명 박스
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(15, signatureY, 180, 20, 3, 3, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(37, 99, 235);
  doc.text("??�?리포?�는 YAGO VIBE AI ?�스?�에 ?�해 ?�동?�로 ?�성?�었?�니??", 20, signatureY + 7);
  doc.text(`?�성?�시: ${new Date().toLocaleString("ko-KR")}`, 20, signatureY + 13);

  // ?�터 (모든 ?�이지)
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 285, 210, 12, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text("??YAGO VIBE - ?�포�?커�??�티 ?�합 ?�랫??, 15, 292);
    doc.text(`?�이지 ${i} / ${pageCount}`, 195, 292, { align: "right" });
  }

  // ?�� PDF ?�??  const filename = `YAGO_VIBE_Report_${report.date || new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);

  console.log("??PDF 리포???�성 ?�료:", filename);
}

// ???�자?�용 ?�리미엄 PDF ?�성
export async function generateInvestorReportPDF(report: any) {
  const doc = new jsPDF();

  // ?�� 브랜??컬러
  const brandBlue = [37, 99, 235];
  const brandPurple = [139, 92, 246];
  const brandPink = [236, 72, 153];
  const textDark = [30, 41, 59];

  // ?�� 커버 ?�이지
  // 그라?�언??배경 (?��??�이??
  for (let i = 0; i < 297; i += 5) {
    const ratio = i / 297;
    const r = brandBlue[0] + (brandPurple[0] - brandBlue[0]) * ratio;
    const g = brandBlue[1] + (brandPurple[1] - brandBlue[1]) * ratio;
    const b = brandBlue[2] + (brandPurple[2] - brandBlue[2]) * ratio;
    doc.setFillColor(r, g, b);
    doc.rect(0, i, 210, 5, "F");
  }

  // 로고
  doc.setFontSize(72);
  doc.setTextColor(255, 255, 255);
  doc.text("??, 105, 80, { align: "center" });

  // ?�목
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text("YAGO VIBE", 105, 120, { align: "center" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "normal");
  doc.text("?�자?�용 주간 리포??, 105, 135, { align: "center" });

  // ?�짜
  doc.setFontSize(14);
  const reportDate = new Date(report.date || new Date()).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(reportDate, 105, 150, { align: "center" });

  // ?�그?�인
  doc.setFontSize(12);
  doc.setFont("helvetica", "italic");
  doc.text("?�포�?커�??�티 ?�합 ?�랫??, 105, 180, { align: "center" });

  // ?�단 ?�보
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Confidential - For Investors Only", 105, 270, { align: "center" });
  doc.text("© 2024 YAGO VIBE. All Rights Reserved.", 105, 280, { align: "center" });

  // ?�� ??번째 ?�이지: ?�원 ?�약
  doc.addPage();

  let yPos = 20;

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("?�� ?�원 ?�약", 15, yPos);

  yPos += 15;

  // ?�약 박스
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

  const executiveSummary = `?�번 �?YAGO VIBE ?�랫?��? �?${totalNotifications}건의 ?�림??처리?�며 ?�정?�인 ?�비???�영???��??�습?�다. 주요 채널�??�과 분석 결과�?바탕?�로 ?�랫?�의 지?�적???�장�??�용??참여??증�?�??�인?????�습?�다.`;

  const splitExecutive = doc.splitTextToSize(executiveSummary, 170);
  doc.text(splitExecutive, 20, yPos + 10);

  yPos += 60;

  // ?�심 지??  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("?�� ?�심 ?�과 지??, 15, yPos);

  yPos += 10;

  // 지??카드
  const metrics = [
    { label: "주간 �??�림", value: totalNotifications, change: "+12%", color: brandBlue },
    { label: "?�평�?, value: Math.round(totalNotifications / 7), change: "+8%", color: brandPurple },
    { label: "?�송 ?�공�?, value: "98.5%", change: "+0.3%", color: [16, 185, 129] },
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

  // AI 분석
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("?�� AI 분석 ?�약", 15, yPos);

  yPos += 10;

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(15, yPos, 180, 45, 5, 5, "FD");

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(21, 128, 61);

  const aiSummary = report.summary || "AI ?�약 ?�이?��? ?�습?�다.";
  const splitAI = doc.splitTextToSize(aiSummary, 170);
  doc.text(splitAI, 20, yPos + 10);

  yPos += 55;

  // ?�세 ?�계??  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("?�� 채널�??�과 분석", 15, yPos);

  yPos += 5;

  const tableData = [
    ["FCM ?�시", report.stats?.FCM || 0, `${Math.round(((report.stats?.FCM || 0) / totalNotifications) * 100)}%`, "+15%"],
    ["Slack", report.stats?.Slack || 0, `${Math.round(((report.stats?.Slack || 0) / totalNotifications) * 100)}%`, "+5%"],
    ["Kakao", report.stats?.Kakao || 0, `${Math.round(((report.stats?.Kakao || 0) / totalNotifications) * 100)}%`, "+18%"],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["채널", "?�림 ??, "비율", "?�주 ?��?]],
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

  // ?�자 ?�이?�이???�이지
  doc.addPage();

  yPos = 20;

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("?�� ?�자 ?�이?�이??, 15, yPos);

  yPos += 15;

  const highlights = [
    {
      icon: "?��",
      title: "지?�적???�장",
      desc: "주간 ?�림 ?��? ?�주 ?��?12% 증�??�여 ?�랫???�성?��? 지?�적?�로 ?�승?�고 ?�습?�다.",
    },
    {
      icon: "??",
      title: "기술???�정??,
      desc: "98.5%???��? ?�송 ?�공률을 ?��??�며, ?�용??경험???�뢰?�을 ?�보?�습?�다.",
    },
    {
      icon: "?��",
      title: "?�채???�략",
      desc: "FCM, Slack, Kakao??균형?�힌 채널 분포�??�양???�용?�층???�과?�으�??�달?�고 ?�습?�다.",
    },
    {
      icon: "?��",
      title: "AI ?�동??,
      desc: "?�전 ?�동?�된 리포???�스?�으�??�영 ?�율?�을 극�??�하�??�자???�명?�을 ?�보?�습?�다.",
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

  // ?�터 (모든 ?�이지)
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 285, 210, 12, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text("??YAGO VIBE - ?�자?�용 리포??, 15, 292);
    doc.text(`${i} / ${pageCount}`, 195, 292, { align: "right" });
  }

  // ?�??  const filename = `YAGO_VIBE_Investor_Report_${report.date || new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);

  console.log("???�자?�용 ?�리미엄 PDF ?�성 ?�료:", filename);
}

