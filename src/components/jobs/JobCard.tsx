import { formatKRW, shareOrCopy } from '@/utils/ui';
import { useSaves } from '@/hooks/useSaves';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    region: string;
    type: string;
    pay: {
      type: 'hour' | 'month';
      amount: number;
    };
    description?: string;
    requirements?: string;
    postedAt?: string;
  };
}

export default function JobCard({ job }: JobCardProps) {
  const { isSaved, toggle } = useSaves();
  
  return (
    <div className="relative rounded-2xl border p-3 bg-white/90 dark:bg-zinc-900">
      <div className="absolute top-2 right-2 flex gap-1">
        <button 
          aria-label="공유" 
          onClick={() => shareOrCopy({ title: job.title, url: location.href })}
          className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          🔗
        </button>
        <button 
          aria-label="저장" 
          onClick={() => toggle(`job:${job.id}`, {
            title: job.title,
            type: 'job',
            company: job.company,
            region: job.region
          })}
          className={`px-2 py-1 rounded-lg transition-colors ${
            isSaved(`job:${job.id}`) 
              ? 'bg-yellow-400 text-black' 
              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          ⭐
        </button>
      </div>
      <div className="text-sm text-zinc-500 mb-1">{job.company} · {job.region}</div>
      <div className="font-semibold">{job.title}</div>
      <div className="text-sm">
        {job.type} · {job.pay?.type === 'hour' ? `시급 ${formatKRW(job.pay.amount)}` : `월 ${formatKRW(job.pay.amount)}`}
      </div>
      {job.description && (
        <div className="text-sm text-zinc-600 mt-2 line-clamp-2">{job.description}</div>
      )}
      <div className="pt-2">
        <button className="btn btn-primary inline-flex items-center justify-center w-full">
          지원하기
        </button>
      </div>
    </div>
  );
}
