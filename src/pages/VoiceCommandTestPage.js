import { useState } from "react";
import { useVoiceAgent } from "../voice/useVoiceAgent";
export default function VoiceCommandTestPage() { const [testInput, setTestInput] = useState(""); const [lastResult, setLastResult] = useState(null); const { handleTranscript, last, lastCmd } = useVoiceAgent(); const testCommands = ["마켓?�로 ?�동", "축구??카테고리 보여�?,    " ?  : ]; }
