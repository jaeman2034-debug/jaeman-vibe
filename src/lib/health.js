export async function getHealth() {
    const r = await fetch('/api/health', { cache: 'no-store' });
    const json = await r.json();
    return json;
}
