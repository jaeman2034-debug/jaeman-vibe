import BlogForm from "@/features/blog/BlogForm";

export default function BlogPage() {
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">📝 블로그 작성 테스트</h1>
      <BlogForm />
    </div>
  );
}
