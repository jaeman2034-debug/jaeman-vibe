import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";

const app = express();
const PORT = 3001;

// 미들웨어 설정
app.use(express.json());
app.use(cors());

// DB 연결
const dbPromise = open({
  filename: "./data/market.db",
  driver: sqlite3.Database,
});

// DB 초기화
const initDB = async () => {
  const db = await dbPromise;
  
  // 블로그 테이블 생성
  await db.exec(`
    CREATE TABLE IF NOT EXISTS blog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT DEFAULT '관리자',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 댓글 테이블 생성
  await db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blog_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      author TEXT DEFAULT '익명',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(blog_id) REFERENCES blog(id) ON DELETE CASCADE
    )
  `);

  console.log("✅ DB 테이블 초기화 완료");
};

// 블로그 목록 조회
app.get("/blogs", async (req, res) => {
  try {
    const db = await dbPromise;
    const blogs = await db.all("SELECT * FROM blog ORDER BY created_at DESC");
    res.json(blogs);
  } catch (error) {
    console.error("블로그 목록 조회 오류:", error);
    res.status(500).json({ error: "블로그 목록을 불러올 수 없습니다." });
  }
});

// 블로그 상세 조회
app.get("/blogs/:id", async (req, res) => {
  try {
    const db = await dbPromise;
    const blog = await db.get("SELECT * FROM blog WHERE id = ?", [req.params.id]);
    
    if (!blog) {
      return res.status(404).json({ error: "블로그를 찾을 수 없습니다." });
    }
    
    res.json(blog);
  } catch (error) {
    console.error("블로그 상세 조회 오류:", error);
    res.status(500).json({ error: "블로그를 불러올 수 없습니다." });
  }
});

// 블로그 수정
app.put("/blogs/:id", async (req, res) => {
  try {
    const db = await dbPromise;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "제목과 내용을 모두 입력해야 합니다." });
    }

    await db.run(
      "UPDATE blog SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [title, content, req.params.id]
    );

    res.json({ status: "ok", message: "Blog updated!" });
  } catch (error) {
    console.error("블로그 수정 오류:", error);
    res.status(500).json({ error: "블로그를 수정할 수 없습니다." });
  }
});

// 블로그 삭제
app.delete("/blogs/:id", async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run("DELETE FROM blog WHERE id = ?", [req.params.id]);
    res.json({ status: "ok", message: "Blog deleted!" });
  } catch (error) {
    console.error("블로그 삭제 오류:", error);
    res.status(500).json({ error: "블로그를 삭제할 수 없습니다." });
  }
});

// 댓글 조회
app.get("/blogs/:id/comments", async (req, res) => {
  try {
    const db = await dbPromise;
    const comments = await db.all(
      "SELECT * FROM comments WHERE blog_id = ? ORDER BY created_at DESC",
      [req.params.id]
    );
    res.json(comments);
  } catch (error) {
    console.error("댓글 조회 오류:", error);
    res.status(500).json({ error: "댓글을 불러올 수 없습니다." });
  }
});

// 댓글 작성
app.post("/blogs/:id/comments", async (req, res) => {
  try {
    const db = await dbPromise;
    const { content, author } = req.body;

    if (!content) {
      return res.status(400).json({ error: "댓글 내용을 입력해야 합니다." });
    }

    await db.run(
      "INSERT INTO comments (blog_id, content, author) VALUES (?, ?, ?)",
      [req.params.id, content, author || "익명"]
    );

    res.json({ status: "ok", message: "Comment added!" });
  } catch (error) {
    console.error("댓글 작성 오류:", error);
    res.status(500).json({ error: "댓글을 저장할 수 없습니다." });
  }
});

// 댓글 삭제
app.delete("/comments/:id", async (req, res) => {
  try {
    const db = await dbPromise;
    const result = await db.run("DELETE FROM comments WHERE id = ?", [
      req.params.id,
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "댓글을 찾을 수 없습니다." });
    }

    res.json({ status: "ok", message: "Comment deleted!" });
  } catch (error) {
    console.error("댓글 삭제 오류:", error);
    res.status(500).json({ error: "댓글을 삭제할 수 없습니다." });
  }
});

// 댓글 수정
app.put("/comments/:id", async (req, res) => {
  try {
    const { content } = req.body;
    const db = await dbPromise;

    if (!content) {
      return res.status(400).json({ error: "댓글 내용을 입력해야 합니다." });
    }

    const result = await db.run("UPDATE comments SET content = ? WHERE id = ?", [
      content,
      req.params.id,
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "댓글을 찾을 수 없습니다." });
    }

    res.json({ status: "ok", message: "Comment updated!" });
  } catch (error) {
    console.error("댓글 수정 오류:", error);
    res.status(500).json({ error: "댓글을 수정할 수 없습니다." });
  }
});

// 블로그 생성 (직접 DB 저장)
app.post("/blogs", async (req, res) => {
  try {
    const { title, content, author = "관리자" } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: "제목과 내용은 필수입니다." });
    }
    
    const db = await dbPromise;
    const result = await db.run(
      "INSERT INTO blog (title, content, author) VALUES (?, ?, ?)",
      [title, content, author]
    );
    
    res.json({
      id: result.lastID,
      title,
      content,
      author,
      message: "블로그가 성공적으로 저장되었습니다."
    });
  } catch (error) {
    console.error("블로그 생성 오류:", error);
    res.status(500).json({ error: "블로그를 저장할 수 없습니다." });
  }
});

// 서버 시작
app.listen(PORT, async () => {
  await initDB(); // DB 초기화
  console.log(`✅ Express API 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📚 블로그 목록: GET http://localhost:${PORT}/blogs`);
  console.log(`📖 블로그 상세: GET http://localhost:${PORT}/blogs/:id`);
  console.log(`📝 블로그 생성: POST http://localhost:${PORT}/blogs`);
  console.log(`✏️ 블로그 수정: PUT http://localhost:${PORT}/blogs/:id`);
  console.log(`🗑️ 블로그 삭제: DELETE http://localhost:${PORT}/blogs/:id`);
  console.log(`💬 댓글 조회: GET http://localhost:${PORT}/blogs/:id/comments`);
  console.log(`💬 댓글 작성: POST http://localhost:${PORT}/blogs/:id/comments`);
  console.log(`✏️ 댓글 수정: PUT http://localhost:${PORT}/comments/:id`);
  console.log(`🗑️ 댓글 삭제: DELETE http://localhost:${PORT}/comments/:id`);
});
