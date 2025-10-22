import PostCard from "@/components/PostCard";

export default function PostsPage() {
  return (
    <div className="p-4 grid gap-4">
      <PostCard
        id="p1"
        title="첫 번째 게시글"
        content="이건 테스트 게시글 내용입니다."
        initialLikes={3}
        initialViews={10}
      />
      <PostCard
        id="p2"
        title="두 번째 게시글"
        content="여기는 댓글, 좋아요, 조회수가 다 됩니다."
      />
    </div>
  );
}
