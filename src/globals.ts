// Global diagnostic functions for browser console access
;(window as any).diag = {
  ...(window as any).diag,
  env() {
    console.log('[env]', import.meta.env)
  },
  // 썸네일 디버그 함수
  testThumbnail() {
    const el = document.querySelector('input[type=file]') as HTMLInputElement;
    const f = el?.files?.[0];
    if (f) {
      const url = URL.createObjectURL(f);
      console.log('[THUMB DEBUG] preview url:', url);
      const img = new Image();
      img.src = url;
      img.style.cssText = 'width:180px;height:180px;object-fit:cover;border:1px solid #ddd;border-radius:8px;margin:8px;';
      document.body.appendChild(img);
      console.log('[THUMB DEBUG] test image added to body');
    } else {
      console.log('[THUMB DEBUG] no file selected');
    }
  },
  // 썸네일 상태 확인
  checkThumbnailState() {
    const el = document.querySelector('input[type=file]') as HTMLInputElement;
    const f = el?.files?.[0];
    console.log('[THUMB DEBUG] file input files:', el?.files);
    console.log('[THUMB DEBUG] selected file:', f);
    if (f) {
      console.log('[THUMB DEBUG] file details:', {
        name: f.name,
        type: f.type,
        size: f.size,
        lastModified: f.lastModified
      });
    }
  },
  // 미리보기 자동부착 (라우트 전환/리렌더에도 다시 붙여줌)
  attachThumbnailPreview() {
    const attach = () => {
      const inp = document.querySelector('input[type="file"][accept*="image"]') || document.querySelector('input[type="file"]');
      if (!inp || inp.__thumbAttached) return;
      inp.__thumbAttached = true;

      // 미리보기 박스 (input 옆)
      let box = document.getElementById('thumbBox');
      if (!box) {
        box = document.createElement('div');
        box.id = 'thumbBox';
        box.style.cssText = 'width:180px;height:180px;border:1px solid #ddd;border-radius:8px;overflow:hidden;margin-top:8px;';
        inp.parentElement.appendChild(box);
      }

      const handler = () => {
        const f = inp.files?.[0];
        if (!f) return;
        const url = URL.createObjectURL(f);
        console.log('[THUMB:test] file=', f.name, 'url=', url);
        box.innerHTML = '';
        const img = new Image();
        img.src = url;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
        box.appendChild(img);
      };

      inp.addEventListener('change', handler);
      console.log('[THUMB:test] change handler attached');
    };

    // 최초 부착
    attach();

    // DOM이 바뀔 때마다 재부착
    const mo = new MutationObserver(() => attach());
    mo.observe(document.body, { childList: true, subtree: true });
    console.log('[THUMB:test] MutationObserver started');
  }
}
