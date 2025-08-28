import { useEffect } from "react";
import { useVoiceAgent } from "../useVoiceAgent";
export default function VoiceTestInjector() { const { handleTranscript } = useVoiceAgent(); useEffect(() => { const fn = (e) => handleTranscript(e.detail); window.addEventListener("__voice_test__", fn); return () => window.removeEventListener("__voice_test__", fn); }, [handleTranscript]); return null; }
