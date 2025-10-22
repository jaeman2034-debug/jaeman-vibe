import useNotifySettings from "@/features/notify/useNotifySettings";

export default function Settings() {
  const { settings, loading, save, enablePush, disablePush } = useNotifySettings();

  if (loading) return <div className="p-4">로딩중…</div>;

  return (
    <div className="p-4 space-y-4 max-w-xl">
      <h1 className="text-xl font-semibold">설정</h1>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!settings.notifyTrade}
            onChange={e => save({ notifyTrade: e.target.checked })}
          />
          거래 알림
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!settings.notifyChat}
            onChange={e => save({ notifyChat: e.target.checked })}
          />
          채팅 알림
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={enablePush} className="px-3 py-1 border rounded">푸시 활성화</button>
        <button onClick={disablePush} className="px-3 py-1 border rounded">푸시 비활성화</button>
      </div>

      <p className="text-xs text-muted-foreground">
        브라우저 알림 권한이 꺼져 있으면 푸시가 오지 않습니다. (주소창 🔔 확인)
      </p>
    </div>
  );
}
