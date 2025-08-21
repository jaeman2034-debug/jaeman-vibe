export default function AppSplash({ small = false }: { small?: boolean }) {
  return small ? (
    <div className="p-6 text-center text-sm opacity-70">불러오는 중…</div>
  ) : (
    <div className="min-h-dvh grid place-items-center p-6">
      <div className="animate-pulse text-center opacity-80">불러오는 중…</div>
    </div>
  );
} 