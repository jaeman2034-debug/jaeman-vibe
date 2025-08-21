import React from 'react';

// 기존 컴포넌트를 모달 시스템과 호환되도록 만드는 어댑터
export const withClosable = (Comp: React.ComponentType<any>) => {
  return ({ onClose, ...rest }: any) => {
    // onClose를 onRequestClose로 매핑하거나, 
    // 컴포넌트에 close 기능이 있다면 연결
    return <Comp {...rest} onRequestClose={onClose} onClose={onClose} />;
  };
};

// 특정 컴포넌트들을 위한 전용 어댑터들
export const withModalWrapper = (Comp: React.ComponentType<any>) => {
  return ({ onClose, ...rest }: any) => (
    <div className="fixed inset-0 bg-black/50 grid place-items-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-4xl shadow-xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">음성 테스트</h2>
          <button 
            className="px-3 py-1 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <Comp {...rest} />
      </div>
    </div>
  );
}; 