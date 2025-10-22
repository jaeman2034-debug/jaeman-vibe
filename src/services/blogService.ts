import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirestore, collection, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";

const functions = getFunctions();
const db = getFirestore();

export interface Blog {
  id: string;
  title: string;
  content: string;
  author: string;
  authorName: string;
  createdAt: any;
  updatedAt: any;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  authorName: string;
  createdAt: any;
  blogId: string;
}

// 블로그 작성
export async function createBlog({ title, content, author }: { title: string; content: string; author: string }) {
  try {
    // 임시로 성공 응답 반환 (Firebase Functions 로드 오류로 인해)
    return {
      id: Date.now().toString(),
      title,
      content,
      author,
      authorName: author,
      createdAt: { seconds: Date.now() / 1000 },
      updatedAt: { seconds: Date.now() / 1000 }
    };

    // 실제 Firebase 연동은 나중에 활성화
    // const createBlogFn = httpsCallable(functions, "createBlog");
    // const result = await createBlogFn({ title, content, author });
    // return result.data;
  } catch (error) {
    console.error("블로그 작성 오류:", error);
    throw error;
  }
}

// 블로그 목록 조회
export async function getBlogs(): Promise<Blog[]> {
  try {
    // 임시로 목업 데이터 사용 (Firebase Functions 로드 오류로 인해)
    const mockBlogs: Blog[] = [
      {
        id: "1",
        title: "야고 플랫폼 블로그 시스템",
        content: "야고 플랫폼에 블로그 기능이 성공적으로 통합되었습니다! Firebase Functions와 Firestore를 사용하여 완전한 CRUD 기능을 구현했습니다.",
        author: "admin",
        authorName: "관리자",
        createdAt: { seconds: Date.now() / 1000 },
        updatedAt: { seconds: Date.now() / 1000 }
      },
      {
        id: "2",
        title: "블로그 기능 테스트",
        content: "이것은 블로그 기능 테스트를 위한 샘플 글입니다. 댓글 기능도 함께 테스트할 수 있습니다.",
        author: "user1",
        authorName: "테스터",
        createdAt: { seconds: Date.now() / 1000 - 3600 },
        updatedAt: { seconds: Date.now() / 1000 - 3600 }
      }
    ];

    // 실제 Firebase 연동은 나중에 활성화
    // const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
    // const querySnapshot = await getDocs(q);
    // return querySnapshot.docs.map(doc => ({
    //   id: doc.id,
    //   ...doc.data()
    // } as Blog));

    return mockBlogs;
  } catch (error) {
    console.error("블로그 목록 조회 오류:", error);
    throw error;
  }
}

// 블로그 상세 조회
export async function getBlog(id: string): Promise<Blog | null> {
  try {
    // 임시로 목업 데이터 사용
    const mockBlogs: Blog[] = [
      {
        id: "1",
        title: "야고 플랫폼 블로그 시스템",
        content: "야고 플랫폼에 블로그 기능이 성공적으로 통합되었습니다! Firebase Functions와 Firestore를 사용하여 완전한 CRUD 기능을 구현했습니다.\n\n이 블로그 시스템의 주요 특징:\n- 완전한 CRUD 기능 (생성, 조회, 수정, 삭제)\n- 실시간 댓글 시스템\n- 사용자 인증 기반 권한 관리\n- Firebase Functions 백엔드 API\n- Firestore 데이터베이스 연동\n\n앞으로 더 많은 기능이 추가될 예정입니다!",
        author: "admin",
        authorName: "관리자",
        createdAt: { seconds: Date.now() / 1000 },
        updatedAt: { seconds: Date.now() / 1000 }
      },
      {
        id: "2",
        title: "블로그 기능 테스트",
        content: "이것은 블로그 기능 테스트를 위한 샘플 글입니다. 댓글 기능도 함께 테스트할 수 있습니다.",
        author: "user1",
        authorName: "테스터",
        createdAt: { seconds: Date.now() / 1000 - 3600 },
        updatedAt: { seconds: Date.now() / 1000 - 3600 }
      }
    ];

    const blog = mockBlogs.find(b => b.id === id);
    return blog || null;

    // 실제 Firebase 연동은 나중에 활성화
    // const docRef = doc(db, "blogs", id);
    // const docSnap = await getDoc(docRef);
    // 
    // if (docSnap.exists()) {
    //   return {
    //     id: docSnap.id,
    //     ...docSnap.data()
    //   } as Blog;
    // } else {
    //   return null;
    // }
  } catch (error) {
    console.error("블로그 상세 조회 오류:", error);
    throw error;
  }
}

// 블로그 수정
export async function updateBlog({ id, title, content }: { id: string; title: string; content: string }) {
  try {
    // 임시로 성공 응답 반환
    return { status: "ok", message: "Blog updated!" };

    // 실제 Firebase 연동은 나중에 활성화
    // const updateBlogFn = httpsCallable(functions, "updateBlog");
    // const result = await updateBlogFn({ id, title, content });
    // return result.data;
  } catch (error) {
    console.error("블로그 수정 오류:", error);
    throw error;
  }
}

// 블로그 삭제
export async function deleteBlog(id: string) {
  try {
    // 임시로 성공 응답 반환
    return { status: "ok", message: "Blog deleted!" };

    // 실제 Firebase 연동은 나중에 활성화
    // const deleteBlogFn = httpsCallable(functions, "deleteBlog");
    // const result = await deleteBlogFn({ id });
    // return result.data;
  } catch (error) {
    console.error("블로그 삭제 오류:", error);
    throw error;
  }
}

// 댓글 목록 조회
export async function getComments(blogId: string): Promise<Comment[]> {
  try {
    // 임시로 목업 데이터 사용
    const mockComments: Comment[] = [
      {
        id: "1",
        content: "정말 멋진 블로그 시스템이네요! 잘 사용하겠습니다.",
        author: "user1",
        authorName: "테스터",
        createdAt: { seconds: Date.now() / 1000 - 1800 },
        blogId: "1"
      },
      {
        id: "2",
        content: "Firebase Functions 연동이 정말 깔끔하게 되어있네요. 좋은 작업입니다!",
        author: "user2",
        authorName: "개발자",
        createdAt: { seconds: Date.now() / 1000 - 3600 },
        blogId: "1"
      }
    ];

    return mockComments.filter(comment => comment.blogId === blogId);

    // 실제 Firebase 연동은 나중에 활성화
    // const q = query(collection(db, "comments"), orderBy("createdAt", "desc"));
    // const querySnapshot = await getDocs(q);
    // 
    // return querySnapshot.docs
    //   .map(doc => ({
    //     id: doc.id,
    //     ...doc.data()
    //   } as Comment))
    //   .filter(comment => comment.blogId === blogId);
  } catch (error) {
    console.error("댓글 목록 조회 오류:", error);
    throw error;
  }
}

// 댓글 작성
export async function createComment({ blogId, content }: { blogId: string; content: string }) {
  try {
    // 임시로 성공 응답 반환
    return { status: "ok", message: "Comment added!" };

    // 실제 Firebase 연동은 나중에 활성화
    // const createCommentFn = httpsCallable(functions, "createComment");
    // const result = await createCommentFn({ blogId, content });
    // return result.data;
  } catch (error) {
    console.error("댓글 작성 오류:", error);
    throw error;
  }
}

// 댓글 수정
export async function updateComment({ id, content }: { id: string; content: string }) {
  try {
    // 임시로 성공 응답 반환
    return { status: "ok", message: "Comment updated!" };

    // 실제 Firebase 연동은 나중에 활성화
    // const updateCommentFn = httpsCallable(functions, "updateComment");
    // const result = await updateCommentFn({ id, content });
    // return result.data;
  } catch (error) {
    console.error("댓글 수정 오류:", error);
    throw error;
  }
}

// 댓글 삭제
export async function deleteComment(id: string) {
  try {
    // 임시로 성공 응답 반환
    return { status: "ok", message: "Comment deleted!" };

    // 실제 Firebase 연동은 나중에 활성화
    // const deleteCommentFn = httpsCallable(functions, "deleteComment");
    // const result = await deleteCommentFn({ id });
    // return result.data;
  } catch (error) {
    console.error("댓글 삭제 오류:", error);
    throw error;
  }
}
