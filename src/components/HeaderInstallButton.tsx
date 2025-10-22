// ?î• ?§Îçî ?§Ïπò Î≤ÑÌäº - Genius Pack V1
import { promptInstall } from '@/pwa/a2hs';

export default function HeaderInstallButton() {
  return (
    <button 
      onClick={promptInstall} 
      className="px-3 py-1 rounded-xl bg-[#A3E635] text-black font-semibold hover:bg-[#8BC34A] transition-colors text-sm"
      id="pwa-install-button"
      style={{ display: 'none' }}
    >
      ?ì± ???îÎ©¥???§Ïπò
    </button>
  );
}
