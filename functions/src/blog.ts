import "./firebaseAdmin";
import "./globalOptions";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";

const INTERNAL_KEY = defineSecret("INTERNAL_KEY");

// 블로그 목록 조회
export const getBlogs = onRequest(
  { secrets: [INTERNAL_KEY] },
  async (req, res) => {
    try {
      const db = getFirestore();
      const blogsSnapshot = await db.collection("blogs")
        .orderBy("createdAt", "desc")
        .get();

      const blogs = blogsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json(blogs);
    } catch (error) {
      console.error("블로그 목록 조회 오류:", error);
      res.status(500).json({ error: "블로그 목록을 불러올 수 없습니다." });
    }
  }
);

// 블로그 상세 조회
export const getBlog = onRequest(
  { secrets: [INTERNAL_KEY] },
  async (req, res) => {
    try {
      const blogId = req.query.id as string;
      if (!blogId) {
        res.status(400).json({ error: "블로그 ID가 필요합니다." });
        return;
      }

      const db = getFirestore();
      const blogDoc = await db.collection("blogs").doc(blogId).get();
      
      if (!blogDoc.exists) {
        res.status(404).json({ error: "블로그를 찾을 수 없습니다." });
        return;
      }

      res.json({
        id: blogDoc.id,
        ...blogDoc.data()
      });
    } catch (error) {
      console.error("블로그 상세 조회 오류:", error);
      res.status(500).json({ error: "블로그를 불러올 수 없습니다." });
    }
  }
);

// 블로그 작성
export const createBlog = onCall(
  { secrets: [INTERNAL_KEY] },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    
    const { title, content, author } = req.data as { title: string; content: string; author: string };
    
    if (!title || !content || !author) {
      throw new HttpsError("invalid-argument", "제목, 내용, 작성자를 모두 입력해야 합니다.");
    }

    try {
      const db = getFirestore();
      const blogData = {
        title,
        content,
        author: req.auth.uid,
        authorName: author, // 사용자가 입력한 작성자 이름 사용
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const blogRef = await db.collection("blogs").add(blogData);
      
      return {
        id: blogRef.id,
        ...blogData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error("블로그 작성 오류:", error);
      throw new HttpsError("internal", "블로그를 저장할 수 없습니다.");
    }
  }
);

// 블로그 수정
export const updateBlog = onCall(
  { secrets: [INTERNAL_KEY] },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    
    const { blogId, title, content } = req.data as { 
      blogId: string; 
      title: string; 
      content: string; 
    };
    
    if (!blogId || !title || !content) {
      throw new HttpsError("invalid-argument", "블로그 ID, 제목, 내용을 모두 입력해야 합니다.");
    }

    try {
      const db = getFirestore();
      const blogRef = db.collection("blogs").doc(blogId);
      const blogDoc = await blogRef.get();
      
      if (!blogDoc.exists) {
        throw new HttpsError("not-found", "블로그를 찾을 수 없습니다.");
      }

      const blogData = blogDoc.data();
      
      // 작성자 권한 확인
      if (blogData?.author !== req.auth.uid) {
        throw new HttpsError("permission-denied", "블로그를 수정할 권한이 없습니다.");
      }

      await blogRef.update({
        title,
        content,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { status: "ok", message: "Blog updated!" };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error("블로그 수정 오류:", error);
      throw new HttpsError("internal", "블로그를 수정할 수 없습니다.");
    }
  }
);

// 블로그 삭제
export const deleteBlog = onCall(
  { secrets: [INTERNAL_KEY] },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    
    const { blogId } = req.data as { blogId: string };
    
    if (!blogId) {
      throw new HttpsError("invalid-argument", "블로그 ID가 필요합니다.");
    }

    try {
      const db = getFirestore();
      const blogRef = db.collection("blogs").doc(blogId);
      const blogDoc = await blogRef.get();
      
      if (!blogDoc.exists) {
        throw new HttpsError("not-found", "블로그를 찾을 수 없습니다.");
      }

      const blogData = blogDoc.data();
      
      // 작성자 권한 확인
      if (blogData?.author !== req.auth.uid) {
        throw new HttpsError("permission-denied", "블로그를 삭제할 권한이 없습니다.");
      }

      // 블로그와 관련된 댓글도 삭제
      const commentsSnapshot = await db.collection("comments")
        .where("blogId", "==", blogId)
        .get();
      
      const batch = db.batch();
      commentsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      batch.delete(blogRef);
      await batch.commit();

      return { status: "ok", message: "Blog deleted!" };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error("블로그 삭제 오류:", error);
      throw new HttpsError("internal", "블로그를 삭제할 수 없습니다.");
    }
  }
);

// 댓글 목록 조회
export const getComments = onRequest(
  { secrets: [INTERNAL_KEY] },
  async (req, res) => {
    try {
      const blogId = req.query.blogId as string;
      if (!blogId) {
        return res.status(400).json({ error: "블로그 ID가 필요합니다." });
      }

      const db = getFirestore();
      const commentsSnapshot = await db.collection("comments")
        .where("blogId", "==", blogId)
        .orderBy("createdAt", "desc")
        .get();

      const comments = commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json(comments);
    } catch (error) {
      console.error("댓글 목록 조회 오류:", error);
      res.status(500).json({ error: "댓글 목록을 불러올 수 없습니다." });
    }
  }
);

// 댓글 작성
export const createComment = onCall(
  { secrets: [INTERNAL_KEY] },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    
    const { blogId, content } = req.data as { blogId: string; content: string };
    
    if (!blogId || !content) {
      throw new HttpsError("invalid-argument", "블로그 ID와 댓글 내용을 입력해야 합니다.");
    }

    try {
      const db = getFirestore();
      const commentData = {
        blogId,
        content,
        author: req.auth.uid,
        authorName: req.auth.token.name || "익명",
        createdAt: FieldValue.serverTimestamp(),
      };

      const commentRef = await db.collection("comments").add(commentData);
      
      return {
        id: commentRef.id,
        ...commentData,
        createdAt: new Date()
      };
    } catch (error) {
      console.error("댓글 작성 오류:", error);
      throw new HttpsError("internal", "댓글을 저장할 수 없습니다.");
    }
  }
);

// 댓글 수정
export const updateComment = onCall(
  { secrets: [INTERNAL_KEY] },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    
    const { commentId, content } = req.data as { commentId: string; content: string };
    
    if (!commentId || !content) {
      throw new HttpsError("invalid-argument", "댓글 ID와 내용을 입력해야 합니다.");
    }

    try {
      const db = getFirestore();
      const commentRef = db.collection("comments").doc(commentId);
      const commentDoc = await commentRef.get();
      
      if (!commentDoc.exists) {
        throw new HttpsError("not-found", "댓글을 찾을 수 없습니다.");
      }

      const commentData = commentDoc.data();
      
      // 작성자 권한 확인
      if (commentData?.author !== req.auth.uid) {
        throw new HttpsError("permission-denied", "댓글을 수정할 권한이 없습니다.");
      }

      await commentRef.update({
        content,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { status: "ok", message: "Comment updated!" };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error("댓글 수정 오류:", error);
      throw new HttpsError("internal", "댓글을 수정할 수 없습니다.");
    }
  }
);

// 댓글 삭제
export const deleteComment = onCall(
  { secrets: [INTERNAL_KEY] },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    
    const { commentId } = req.data as { commentId: string };
    
    if (!commentId) {
      throw new HttpsError("invalid-argument", "댓글 ID가 필요합니다.");
    }

    try {
      const db = getFirestore();
      const commentRef = db.collection("comments").doc(commentId);
      const commentDoc = await commentRef.get();
      
      if (!commentDoc.exists) {
        throw new HttpsError("not-found", "댓글을 찾을 수 없습니다.");
      }

      const commentData = commentDoc.data();
      
      // 작성자 권한 확인
      if (commentData?.author !== req.auth.uid) {
        throw new HttpsError("permission-denied", "댓글을 삭제할 권한이 없습니다.");
      }

      await commentRef.delete();

      return { status: "ok", message: "Comment deleted!" };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error("댓글 삭제 오류:", error);
      throw new HttpsError("internal", "댓글을 삭제할 수 없습니다.");
    }
  }
);
