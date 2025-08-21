import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function BottomSheet({
  open, onClose, children,
}: { open: boolean; onClose?: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    
    // 모달 열릴 때 배경 스크롤 잠금
    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");
    
    // ESC 키로 닫기
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.documentElement.classList.remove("modal-open");
      document.body.classList.remove("modal-open");
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;
  
  return createPortal(
    <>
      {/* 배경 클릭 시 닫기 - 높은 z-index로 확실한 배치 */}
      <div 
        className="modal-backdrop" 
        onClick={onClose}
        style={{ zIndex: 999998 }}
        role="presentation"
        aria-hidden="true"
      />
      
      {/* 시트: 내부 클릭이 배경으로 전파되지 않도록 가드 */}
      <div
        className="modal-sheet"
        role="dialog" 
        aria-modal="true"
        aria-labelledby="modal-title"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        style={{ 
          zIndex: 999999,
          position: 'fixed',
          left: 0, 
          right: 0, 
          bottom: 0,
          margin: '0 auto',
          maxWidth: '640px',
          maxHeight: 'min(80dvh, 560px)',
          background: '#fff',
          borderRadius: '16px 16px 0 0',
          padding: '16px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          overflow: 'auto',
          pointerEvents: 'auto',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.12)',
          border: '1px solid #e5e7eb'
        }}
      >
        {children}
      </div>
    </>,
    document.body
  );
} 