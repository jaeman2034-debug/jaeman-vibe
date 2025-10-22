import request from "supertest";
import { describe, it, expect } from "vitest";

const BASE_URL = "http://localhost:3001"; // Express API 서버 포트
const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/chat-final-250927-z1"; // n8n Webhook

describe("YAGO Blog + Comment + n8n Integration", () => {
  let blogId: string;
  let commentId: string;

  it("블로그 글 작성 (n8n Webhook)", async () => {
    const res = await request(N8N_WEBHOOK_URL)
      .post("")
      .send({
        payload: {
          title: "테스트 글 1",
          content: "테스트 본문입니다.",
        },
      })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.message).toBe("Blog saved!");
    blogId = res.body.id || "mock-id";
  });

  it("블로그 글 조회", async () => {
    const res = await request(BASE_URL).get(`/blogs/${blogId}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("테스트 글 1");
    expect(res.body.content).toBe("테스트 본문입니다.");
  });

  it("블로그 글 수정", async () => {
    const res = await request(BASE_URL)
      .put(`/blogs/${blogId}`)
      .send({ 
        title: "수정된 테스트 글", 
        content: "수정된 테스트 본문입니다." 
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.message).toBe("Blog updated!");
  });

  it("댓글 작성", async () => {
    const res = await request(BASE_URL)
      .post(`/blogs/${blogId}/comments`)
      .send({ 
        content: "테스트 댓글입니다.",
        author: "테스터"
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.message).toBe("Comment added!");
    
    // 댓글 ID를 얻기 위해 댓글 목록 조회
    const commentsRes = await request(BASE_URL).get(`/blogs/${blogId}/comments`);
    expect(commentsRes.status).toBe(200);
    expect(commentsRes.body.length).toBeGreaterThan(0);
    commentId = commentsRes.body[0].id;
  });

  it("댓글 조회", async () => {
    const res = await request(BASE_URL).get(`/blogs/${blogId}/comments`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    
    const comment = res.body.find((c: any) => c.content === "테스트 댓글입니다.");
    expect(comment).toBeDefined();
    expect(comment.author).toBe("테스터");
  });

  it("댓글 수정", async () => {
    const res = await request(BASE_URL)
      .put(`/comments/${commentId}`)
      .send({ content: "수정된 댓글입니다." });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.message).toBe("Comment updated!");
  });

  it("댓글 삭제", async () => {
    const res = await request(BASE_URL).delete(`/comments/${commentId}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.message).toBe("Comment deleted!");
  });

  it("블로그 글 삭제", async () => {
    const res = await request(BASE_URL).delete(`/blogs/${blogId}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.message).toBe("Blog deleted!");
  });

  it("블로그 목록 조회", async () => {
    const res = await request(BASE_URL).get("/blogs");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("API 엔드포인트 검증", () => {
  it("존재하지 않는 블로그 조회 시 404", async () => {
    const res = await request(BASE_URL).get("/blogs/99999");
    expect(res.status).toBe(404);
  });

  it("존재하지 않는 댓글 삭제 시 404", async () => {
    const res = await request(BASE_URL).delete("/comments/99999");
    expect(res.status).toBe(404);
  });

  it("빈 내용으로 댓글 작성 시 400", async () => {
    const res = await request(BASE_URL)
      .post("/blogs/1/comments")
      .send({ content: "" });

    expect(res.status).toBe(400);
  });

  it("빈 제목으로 블로그 수정 시 400", async () => {
    const res = await request(BASE_URL)
      .put("/blogs/1")
      .send({ title: "", content: "내용" });

    expect(res.status).toBe(400);
  });
});
