export default function VADTestModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full shadow-xl">
      <h2 className="text-xl font-bold mb-4">VAD Test (Modal)</h2>
      {/* TODO: 실제 VAD 테스트 UI 연결 */}
      <p className="opacity-80 mb-6">여기에 VAD 테스트 컴포넌트를 넣으세요.</p>
      <button className="px-4 py-2 rounded-lg bg-zinc-900 text-white" onClick={onClose}>닫기</button>
    </div>
  );
} 