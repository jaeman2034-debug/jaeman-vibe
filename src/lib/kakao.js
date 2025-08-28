export function loadKakao() { return new Promise((resolve, reject) => { if (window.kakao?.maps)
    return resolve(window.kakao); const key = import.meta.env.VITE_KAKAO_JS_KEY; if (!key)
    return reject(new Error('VITE_KAKAO_JS_KEY missing')); const exist = document.querySelector('script[data-kakao="sdk"]'); if (exist) {
    exist.addEventListener('load', () => window.kakao.maps.load(() => resolve(window.kakao)));
    return;
} const s = document.createElement('script'); s.dataset.kakao = 'sdk'; s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services,clusterer&autoload=false`; s.onload = () => window.kakao.maps.load(() => resolve(window.kakao)); s.onerror = () => reject(new Error('Kakao SDK load failed')); document.head.appendChild(s); }); }
