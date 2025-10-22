// src/lib/gapi.ts
export async function gapi(path: string, init?: RequestInit) {
  if (!path.startsWith("/")) path = "/" + path;
  const res = await fetch("/gapi" + path, init);
  if (!res.ok) throw new Error(`GAPI ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function gcs(path: string, init?: RequestInit) {
  if (!path.startsWith("/")) path = "/" + path;
  const res = await fetch("/gcs" + path, init);
  if (!res.ok) throw new Error(`GCS ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function identity(path: string, init?: RequestInit) {
  if (!path.startsWith("/")) path = "/" + path;
  const res = await fetch("/identity" + path, init);
  if (!res.ok) throw new Error(`Identity ${res.status}: ${await res.text()}`);
  return res.json();
}
