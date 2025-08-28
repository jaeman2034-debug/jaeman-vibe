import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "@/components/ModalHost";
import { uiBridge } from "@/voice/uiActions";
export function VoiceUiBridgeMount() { const navigate = useNavigate(); const { open } = useModal(); const [overlay, setOverlay] = useState(null); useEffect(() => { uiBridge.setNavigate(navigate); uiBridge.setOpenModal(open); uiBridge.setOverlaySetter(setOverlay); }, [navigate, open]); return overlay ? overlay : null; }
