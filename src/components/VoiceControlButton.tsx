import { Button } from "@/components/ui/button";
import { isSpeaking } from "@/hooks/useTTS";

interface VoiceControlButtonProps {
  listening: boolean;
  canAutoResume: boolean;
  onStart: () => void;
  onStop: () => void;
  className?: string;
}

export function VoiceControlButton({ 
  listening, 
  canAutoResume, 
  onStart, 
  onStop, 
  className 
}: VoiceControlButtonProps) {
  if (listening) {
    return (
      <Button onClick={onStop} className={className}>
        중�?
      </Button>
    );
  }

  return (
    <Button 
      onClick={onStart} 
      disabled={canAutoResume === false && isSpeaking()}
      className={className}
    >
      ?�작
    </Button>
  );
}
