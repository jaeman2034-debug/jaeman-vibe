"use strict";
// src/apis/chatApi.tsexport async function sendChat(message: string) {  const res = await fetch('/api/chat', {    method: 'POST',    headers: { 'Content-Type': 'application/json' },    body: JSON.stringify({ message }),  });  if (!res.ok) throw new Error(`chat api failed: ${res.status}`);  return res.json() as Promise<{ reply: string }>;} 
