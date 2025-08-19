import InfiniteGrid from "../../features/lists/InfiniteGrid";
import { usePageAI } from "@/voice/pageAI/usePageAI";
import { makeJobsPlugin } from "./jobs.ai";
import PageAITips from "@/voice/pageAI/PageAITips";

export default function JobsListPage() {
  usePageAI("jobs", makeJobsPlugin());
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold mb-4">채용</h1>
      <PageAITips />
      <InfiniteGrid collectionName="jobs" />
    </div>
  );
} 