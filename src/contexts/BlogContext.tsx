import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Blog } from '../services/blogService';

interface BlogContextType {
  blogs: Blog[];
  setBlogs: (blogs: Blog[]) => void;
  addBlog: (blog: Blog) => void;
  updateBlog: (id: string, updatedBlog: Partial<Blog>) => void;
  deleteBlog: (id: string) => void;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export function BlogProvider({ children }: { children: ReactNode }) {
  const [blogs, setBlogs] = useState<Blog[]>([]);

  const addBlog = (blog: Blog) => {
    setBlogs(prevBlogs => [blog, ...prevBlogs]);
  };

  const updateBlog = (id: string, updatedBlog: Partial<Blog>) => {
    setBlogs(prevBlogs => 
      prevBlogs.map(blog => 
        blog.id === id ? { ...blog, ...updatedBlog } : blog
      )
    );
  };

  const deleteBlog = (id: string) => {
    setBlogs(prevBlogs => prevBlogs.filter(blog => blog.id !== id));
  };

  return (
    <BlogContext.Provider value={{ blogs, setBlogs, addBlog, updateBlog, deleteBlog }}>
      {children}
    </BlogContext.Provider>
  );
}

export function useBlogContext() {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlogContext must be used within a BlogProvider');
  }
  return context;
}
