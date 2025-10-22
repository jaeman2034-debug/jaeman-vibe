/**
 * ?´ë?ì§€ URL?ì„œ ?€???‰ìƒ??ì¶”ì¶œ?˜ëŠ” ? í‹¸ë¦¬í‹° ?¨ìˆ˜
 * Canvas APIë¥??¬ìš©?˜ì—¬ ë¸Œë¼?°ì? ?¤ì´?°ë¸Œ ë°©ì‹?¼ë¡œ êµ¬í˜„
 */

export async function extractColorFromImage(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // CORS ë¬¸ì œ ?´ê²°
    
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }
        
        // ?´ë?ì§€ ?¬ê¸°??ë§ì¶° ìº”ë²„???¤ì •
        canvas.width = img.width;
        canvas.height = img.height;
        
        // ?´ë?ì§€ë¥?ìº”ë²„?¤ì— ê·¸ë¦¬ê¸?        ctx.drawImage(img, 0, 0);
        
        // ?´ë?ì§€ ?°ì´??ê°€?¸ì˜¤ê¸?        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // ?½ì? ?‰ìƒ ë¶„ì„ (ê°„ë‹¨???˜í”Œë§?ë°©ì‹)
        const colors: { [key: string]: number } = {};
        const step = Math.max(1, Math.floor(data.length / 4 / 1000)); // ìµœë? 1000ê°??½ì? ?˜í”Œë§?        
        for (let i = 0; i < data.length; i += step * 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          // ?¬ëª…?„ê? ??? ?½ì??€ ?œì™¸
          if (a < 128) continue;
          
          // ?ˆë¬´ ë°ê±°???´ë‘???‰ìƒ ?œì™¸ (ë°°ê²½???œê±°)
          const brightness = (r + g + b) / 3;
          if (brightness < 30 || brightness > 225) continue;
          
          const colorKey = `${r},${g},${b}`;
          colors[colorKey] = (colors[colorKey] || 0) + 1;
        }
        
        // ê°€??ë§ì´ ?˜í????‰ìƒ ì°¾ê¸°
        let dominantColor = "3B82F6"; // ê¸°ë³¸ ?Œë???        let maxCount = 0;
        
        for (const [colorKey, count] of Object.entries(colors)) {
          if (count > maxCount) {
            maxCount = count;
            const [r, g, b] = colorKey.split(",").map(Number);
            dominantColor = rgbToHex(r, g, b);
          }
        }
        
        resolve(`#${dominantColor}`);
      } catch (error) {
        console.error("?‰ìƒ ì¶”ì¶œ ?¤íŒ¨:", error);
        resolve("#3B82F6"); // ê¸°ë³¸ê°?ë°˜í™˜
      }
    };
    
    img.onerror = () => {
      console.error("?´ë?ì§€ ë¡œë“œ ?¤íŒ¨:", imageUrl);
      resolve("#3B82F6"); // ê¸°ë³¸ê°?ë°˜í™˜
    };
    
    img.src = imageUrl;
  });
}

/**
 * RGB ê°’ì„ HEXë¡?ë³€?? */
function rgbToHex(r: number, g: number, b: number): string {
  return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}
