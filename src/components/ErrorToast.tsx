// src/components/ErrorToast.tsx
import React, { useState, useEffect } from 'react';

interface ErrorToastProps {
  error: string | null;
  onClose: () => void;
}

export default function ErrorToast({ error, onClose }: ErrorToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setVisible(true);
      // 5Ï¥????êÎèô?ºÎ°ú ?¨ÎùºÏß?      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // ?†ÎãàÎ©îÏù¥???ÑÎ£å ???ÅÌÉú ?ïÎ¶¨
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, onClose]);

  if (!error || !visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
      <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl mr-2">?†Ô∏è</span>
            <div>
              <p className="font-medium">?§Ìä∏?åÌÅ¨ ?êÎü¨</p>
              <p className="text-sm opacity-90">
                {error.includes('CORS') ? 'CORS ?êÎü¨ - ?ÑÎ°ù???§Ï†ï ?ïÏù∏' : error}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(onClose, 300);
            }}
            className="ml-2 text-white hover:text-gray-200"
          >
            ??          </button>
        </div>
      </div>
    </div>
  );
}
