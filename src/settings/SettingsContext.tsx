import React, { createContext, useContext, useMemo, useState } from "react";

type Settings = {
  locale: string;
  setLocale: (l: string) => void;
  autoFillWhileListening: boolean;
  setAutoFillWhileListening: (enabled: boolean) => void;
};

const SettingsContext = createContext<Settings | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // ✅ 기본값을 ko-KR로 둬서 상위 Provider 문제 시에도 최소한 동작
  const [locale, setLocale] = useState<string>("ko-KR");
  // 자동 채움 스위치 (기본값: false - 안전하게)
  const [autoFillWhileListening, setAutoFillWhileListening] = useState<boolean>(false);

  const value = useMemo(() => ({ 
    locale, 
    setLocale, 
    autoFillWhileListening, 
    setAutoFillWhileListening 
  }), [locale, autoFillWhileListening]);
  
  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    // 개발 중 문제 찾기 쉽게 명확한 에러
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
