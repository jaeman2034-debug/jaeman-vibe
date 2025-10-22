type Cat = { key:string; label:string; emoji:string; };

export type CategoryGridProps = {
  title?: string;
  categories: Cat[];
  onSelect?: (key:string)=>void; // ?�릭 콜백 (?�으�?버튼 비활??링크)
};

export default function CategoryGrid({ title="카테고리", categories, onSelect }: CategoryGridProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">{title}</h2>
        {/* 지???�스???�거: ?�더?�서�??�출 */}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {categories.map(c => (
          <button
            key={c.key}
            onClick={() => onSelect?.(c.key)}
            className="group text-left p-4 h-28 rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/10 hover:shadow transition"
          >
            <div className="text-2xl mb-2">{c.emoji}</div>
            <div className="font-medium group-hover:underline">{c.label}</div>
            <div className="text-[11px] text-gray-400">#{c.key}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
