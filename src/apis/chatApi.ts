// src/apis/chatApi.ts

export async function sendChat(message: string) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });
  
  if (!res.ok) {
    throw new Error('Chat API failed');
  }
  
  return res.json();
} 
