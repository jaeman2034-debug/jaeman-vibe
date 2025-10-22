export default function FAB({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 bg-[#FF7E36] text-white rounded-full shadow-xl px-5 py-3 font-semibold z-40 active:scale-95"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      aria-label="???ÅÌíà ?±Î°ù"
    >
      + ?±Î°ù
    </button>
  );
}
