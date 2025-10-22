/**
 * ?€ ?‰ìƒ??ê¸°ë°˜?¼ë¡œ ê·¸ë¼?”ì–¸???‰ìƒ???ì„±?˜ëŠ” ? í‹¸ë¦¬í‹° ?¨ìˆ˜?? */

/**
 * HEX ?‰ìƒ??RGBë¡?ë³€?? */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * RGBë¥?HEXë¡?ë³€?? */
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/**
 * ?‰ìƒ??ë°ê²Œ ë§Œë“œ???¨ìˆ˜
 */
function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const factor = percent / 100;
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor));
  
  return rgbToHex(r, g, b);
}

/**
 * ?‰ìƒ???´ë‘¡ê²?ë§Œë“œ???¨ìˆ˜
 */
function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const factor = percent / 100;
  const r = Math.round(rgb.r * (1 - factor));
  const g = Math.round(rgb.g * (1 - factor));
  const b = Math.round(rgb.b * (1 - factor));
  
  return rgbToHex(r, g, b);
}

/**
 * ?¬ëª…?„ë? ì¶”ê????‰ìƒ ?ì„±
 */
function addOpacity(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/**
 * ?€ ?‰ìƒ??ê¸°ë°˜?¼ë¡œ Hero ê·¸ë¼?”ì–¸??ë°°ê²½ ?ì„±
 */
export function generateTeamGradient(teamColor: string): string {
  const baseColor = teamColor || "#3B82F6";
  
  // ê¸°ë³¸ ?‰ìƒ?ì„œ ë°ì? ë²„ì „ê³??´ë‘??ë²„ì „ ?ì„±
  const lightColor = lightenColor(baseColor, 20);
  const darkColor = darkenColor(baseColor, 10);
  
  // ?¬ëª…?„ë? ì¶”ê???ë²„ì „??  const lightTransparent = addOpacity(lightColor, 0.8);
  const baseTransparent = addOpacity(baseColor, 0.6);
  
  // 135??ê°ë„ë¡?ê·¸ë¼?”ì–¸???ì„±
  return `linear-gradient(135deg, ${baseColor}, ${lightTransparent}, ${baseTransparent})`;
}

/**
 * ?€ ?‰ìƒ??ê¸°ë°˜?¼ë¡œ ì¹´ë“œ ê·¸ë¼?”ì–¸??ë°°ê²½ ?ì„± (??ë¶€?œëŸ¬??ë²„ì „)
 */
export function generateCardGradient(teamColor: string): string {
  const baseColor = teamColor || "#3B82F6";
  
  const lightColor = lightenColor(baseColor, 30);
  const baseTransparent = addOpacity(baseColor, 0.1);
  
  return `linear-gradient(135deg, ${baseTransparent}, ${lightColor}20)`;
}

/**
 * ?€ ?‰ìƒ??ë³´ìƒ‰(complementary color) ?ì„±
 */
export function generateComplementaryColor(teamColor: string): string {
  const rgb = hexToRgb(teamColor);
  if (!rgb) return "#FFFFFF";
  
  // HSLë¡?ë³€?˜í•˜??ë³´ìƒ‰ ê³„ì‚°
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  
  if (max === min) {
    h = 0; // ë¬´ì±„??  } else if (max === r) {
    h = ((g - b) / (max - min)) % 6;
  } else if (max === g) {
    h = (b - r) / (max - min) + 2;
  } else {
    h = (r - g) / (max - min) + 4;
  }
  
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  
  // ë³´ìƒ‰ ê³„ì‚° (180???Œì „)
  const complementaryH = (h + 180) % 360;
  
  // HSL??RGBë¡??¤ì‹œ ë³€??(ê°„ë‹¨??ë²„ì „)
  const hue = complementaryH / 360;
  const saturation = 0.7;
  const lightness = 0.5;
  
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs((hue * 6) % 2 - 1));
  const m = lightness - c / 2;
  
  let r2, g2, b2;
  if (hue < 1/6) {
    r2 = c; g2 = x; b2 = 0;
  } else if (hue < 2/6) {
    r2 = x; g2 = c; b2 = 0;
  } else if (hue < 3/6) {
    r2 = 0; g2 = c; b2 = x;
  } else if (hue < 4/6) {
    r2 = 0; g2 = x; b2 = c;
  } else if (hue < 5/6) {
    r2 = x; g2 = 0; b2 = c;
  } else {
    r2 = c; g2 = 0; b2 = x;
  }
  
  const finalR = Math.round((r2 + m) * 255);
  const finalG = Math.round((g2 + m) * 255);
  const finalB = Math.round((b2 + m) * 255);
  
  return rgbToHex(finalR, finalG, finalB);
}
