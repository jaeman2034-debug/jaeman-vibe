/**
 * ?��?지 URL?�서 ?�???�상??추출?�는 ?�틸리티 ?�수
 * Canvas API�??�용?�여 브라?��? ?�이?�브 방식?�로 구현
 */

export async function extractColorFromImage(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // CORS 문제 ?�결
    
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }
        
        // ?��?지 ?�기??맞춰 캔버???�정
        canvas.width = img.width;
        canvas.height = img.height;
        
        // ?��?지�?캔버?�에 그리�?        ctx.drawImage(img, 0, 0);
        
        // ?��?지 ?�이??가?�오�?        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // ?��? ?�상 분석 (간단???�플�?방식)
        const colors: { [key: string]: number } = {};
        const step = Math.max(1, Math.floor(data.length / 4 / 1000)); // 최�? 1000�??��? ?�플�?        
        for (let i = 0; i < data.length; i += step * 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          // ?�명?��? ??? ?��??� ?�외
          if (a < 128) continue;
          
          // ?�무 밝거???�두???�상 ?�외 (배경???�거)
          const brightness = (r + g + b) / 3;
          if (brightness < 30 || brightness > 225) continue;
          
          const colorKey = `${r},${g},${b}`;
          colors[colorKey] = (colors[colorKey] || 0) + 1;
        }
        
        // 가??많이 ?��????�상 찾기
        let dominantColor = "3B82F6"; // 기본 ?��???        let maxCount = 0;
        
        for (const [colorKey, count] of Object.entries(colors)) {
          if (count > maxCount) {
            maxCount = count;
            const [r, g, b] = colorKey.split(",").map(Number);
            dominantColor = rgbToHex(r, g, b);
          }
        }
        
        resolve(`#${dominantColor}`);
      } catch (error) {
        console.error("?�상 추출 ?�패:", error);
        resolve("#3B82F6"); // 기본�?반환
      }
    };
    
    img.onerror = () => {
      console.error("?��?지 로드 ?�패:", imageUrl);
      resolve("#3B82F6"); // 기본�?반환
    };
    
    img.src = imageUrl;
  });
}

/**
 * RGB 값을 HEX�?변?? */
function rgbToHex(r: number, g: number, b: number): string {
  return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}
