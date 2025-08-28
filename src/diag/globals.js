// src/diag/globals.ts
// Vite가 항상 제공하는 정적 리소스로 핑
export async function httpPing(opts) {
    const r = await fetch('/api/ping?t=' + Date.now(), { cache: 'no-store' });
    if (!opts?.silent)
        console.debug('[diag.httpPing]', r.ok);
    return r.ok; // true
}
// API 성능 비교 테스트
export async function testApiPerformance() {
    console.group('🚀 API 성능 비교 테스트');
    try {
        console.time('via-proxy');
        await fetch('/api/health?t=' + Date.now(), { cache: 'no-store' });
        console.timeEnd('via-proxy');
    }
    catch (error) {
        console.error('❌ Proxy API 호출 실패:', error);
    }
    console.groupEnd();
}
export function installGlobalErrorHooks() {
    if (window.__diagInstalled)
        return;
    window.__diagInstalled = true;
    window.addEventListener('error', (e) => {
        // 에러 로깅은 유지 (디버깅에 필요)
        console.group('%c[GLOBAL ERROR]', 'color:#fff;background:#e74c3c;padding:2px 6px;border-radius:4px');
        console.error(e.message, e.error || e);
        console.groupEnd();
    });
    window.addEventListener('unhandledrejection', (e) => {
        // 에러 로깅은 유지 (디버깅에 필요)
        console.group('%c[UNHANDLED REJECTION]', 'color:#fff;background:#c0392b;padding:2px 6px;border-radius:4px');
        console.error(e.reason);
        console.groupEnd();
    });
}
export function installDiagAPI() {
    const FB = window.FB;
    window.diag = {
        async httpPing(opts) {
            return await httpPing(opts);
        },
        async testApiPerformance() {
            return await testApiPerformance();
        },
        fb() {
            // FB 상태 확인 (로그 없이)
            if (!FB)
                return { error: 'FB not found on window' };
            return {
                keys: Object.keys(FB),
                authCurrentUser: FB?.auth?.currentUser || null
            };
        },
        async firestorePing() {
            const db = FB?.db;
            if (!db)
                return { error: 'FB.db not found' };
            try {
                const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
                const id = 'ping-' + Date.now();
                await setDoc(doc(db, '__diag', id), { at: serverTimestamp(), ok: true });
                const snap = await getDoc(doc(db, '__diag', id));
                return { exists: snap.exists(), data: snap.data() };
            }
            catch (error) {
                return { error: error instanceof Error ? error.message : 'Unknown error' };
            }
        },
        async storagePing() {
            const storage = FB?.storage;
            if (!storage)
                return { error: 'FB.storage not found' };
            try {
                const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
                const blob = new Blob([`hello-${Date.now()}`], { type: 'text/plain' });
                const path = `__diag/hello-${Date.now()}.txt`;
                const r = ref(storage, path);
                await uploadBytes(r, blob);
                const url = await getDownloadURL(r);
                return { success: true, url };
            }
            catch (error) {
                return { error: error instanceof Error ? error.message : 'Unknown error' };
            }
        },
        async openFilePickerAndUpload(productId) {
            const storage = FB?.storage;
            const db = FB?.db;
            if (!storage || !db)
                return { error: 'FB.storage or FB.db missing' };
            try {
                const [{ ref, uploadBytesResumable, getDownloadURL }, { doc, updateDoc, arrayUnion }] = await Promise.all([import('firebase/storage'), import('firebase/firestore')]);
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async () => {
                    const f = input.files?.[0];
                    if (!f)
                        return;
                    const safe = f.name.replace(/[^a-zA-Z0-9_.-]+/g, '_');
                    const path = `market/${Date.now()}-${safe}`;
                    const task = uploadBytesResumable(ref(storage, path), f, { contentType: f.type });
                    await task;
                    const url = await getDownloadURL(task.snapshot.ref);
                    if (productId) {
                        await updateDoc(doc(db, 'products', productId), {
                            images: arrayUnion({ path, url }),
                            cover: url,
                            hasImages: true
                        });
                    }
                };
                input.click();
                return { success: true, message: 'File picker opened' };
            }
            catch (error) {
                return { error: error instanceof Error ? error.message : 'Unknown error' };
            }
        },
    };
}
