import { useState, useEffect } from "react";
import { getBlogs, getBlog, createBlog, updateBlog, deleteBlog, Blog } from "../services/blogService";

// 블로그 목록 훅
export function useBlogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const data = await getBlogs();
        setBlogs(data);
        setError(null);
      } catch (err) {
        setError("블로그 목록을 불러올 수 없습니다.");
        console.error("블로그 목록 조회 오류:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const refreshBlogs = async () => {
    try {
      const data = await getBlogs();
      setBlogs(data);
    } catch (err) {
      console.error("블로그 목록 새로고침 오류:", err);
    }
  };

  return { blogs, loading, error, refreshBlogs };
}

// 블로그 상세 훅
export function useBlog(id: string) {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchBlog = async () => {
      try {
        setLoading(true);
        const data = await getBlog(id);
        setBlog(data);
        setError(null);
      } catch (err) {
        setError("블로그를 불러올 수 없습니다.");
        console.error("블로그 상세 조회 오류:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  return { blog, loading, error };
}

// 블로그 작성 훅
export function useCreateBlog() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async ({ title, content, author }: { title: string; content: string; author: string }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createBlog({ title, content, author });
      return result;
    } catch (err) {
      setError("블로그 작성에 실패했습니다.");
      console.error("블로그 작성 오류:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

// 블로그 수정 훅
export function useUpdateBlog() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async ({ id, title, content }: { id: string; title: string; content: string }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await updateBlog({ id, title, content });
      return result;
    } catch (err) {
      setError("블로그 수정에 실패했습니다.");
      console.error("블로그 수정 오류:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
}

// 블로그 삭제 훅
export function useDeleteBlog() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await deleteBlog(id);
      return result;
    } catch (err) {
      setError("블로그 삭제에 실패했습니다.");
      console.error("블로그 삭제 오류:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading, error };
}
