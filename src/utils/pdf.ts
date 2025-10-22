import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePdfFromHtml(html: string, filename: string) {
  // 오프스크린 컨테이너 생성
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.left = '-99999px';
  div.style.top = '0';
  div.innerHTML = html;
  document.body.appendChild(div);

  const el = div.firstElementChild as HTMLElement;
  const canvas = await html2canvas(el, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // 이미지 크기 비율로 맞추기
  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let y = 10;
  
  if (imgHeight < pageHeight - 20) {
    pdf.addImage(imgData, 'PNG', 10, y, imgWidth, imgHeight);
  } else {
    // 여러 페이지 분할 (간단 처리)
    let hLeft = imgHeight;
    let position = 10;
    while (hLeft > 0) {
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      hLeft -= pageHeight;
      if (hLeft > 0) {
        pdf.addPage();
        position = 0;
      }
    }
  }

  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  document.body.removeChild(div);
  return { blob, url, filename };
}
