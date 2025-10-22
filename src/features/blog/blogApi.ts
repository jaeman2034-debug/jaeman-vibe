import { callN8NWebhook } from "@/api/n8nClient";

export async function createBlog(title: string, content: string) {
  return await callN8NWebhook("chat-final-250927-z1", { title, content });
}
