type Props = {
  value?: string | null;
  onChange?: (v: string | null) => void;
};

const CATS = ["전체", "축구화", "유니폼", "공", "기타"];

export default function CategoryChips({ value = "전체", onChange }: Props) {
  return (
    <div className="max-w-screen-md mx-auto overflow-x-auto no-scrollbar px-4 py-2">
      <div className="flex gap-2 w-max">
        {CATS.map((c) => {
          const active = (value ?? "전체") === c;
          return (
            <button
              key={c}
              onClick={() => onChange?.(c === "전체" ? null : c)}
              className={[
                "px-3 h-9 rounded-full border text-sm whitespace-nowrap",
                active
                  ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white"
                  : "bg-white border-neutral-200 text-neutral-700 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-200",
              ].join(" ")}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}
