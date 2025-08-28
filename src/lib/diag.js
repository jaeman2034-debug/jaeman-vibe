export async function httpPing(silent = true) {
    const r = await fetch('/api/ping?t=' + Date.now(), { cache: 'no-store' });
    if (!silent)
        console.debug('[diag.ping]', r.ok);
    return r.ok;
}
export async function httpHealth(timeout = 3000) {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeout);
    try {
        const r = await fetch('/api/health', { cache: 'no-store', signal: ctrl.signal });
        const isJson = r.headers.get('content-type')?.includes('application/json');
        const body = isJson ? await r.json() : await r.text();
        return { ok: r.ok, status: r.status, body };
    }
    finally {
        clearTimeout(to);
    }
}
