import { useCallback, useState } from "react";
import { nlu } from "./nlu/simpleNlu";
import { routeCommand } from "./commandRouter";
import { runPageAI } from "./pageAI/registry";

export function useVoiceAgent() {
  const [last, setLast] = useState<string>("");
  const [lastCmd, setLastCmd] = useState<any>(null);

  const handleTranscript = useCallback(async (text: string) => {
    setLast(text);
    // ① 페이지 플러그인 우선
    const pageHandled = await runPageAI(text);
    if (pageHandled) return;

    // ② 전역 NLU
    const cmd = nlu(text);
    setLastCmd(cmd);
    if (cmd) await routeCommand(cmd);
  }, []);

  return { handleTranscript, last, lastCmd };
} 