import { createContext, useContext, useState } from "react";

type Toast = { id:number; text:string };
const ToastCtx = createContext<(t:string)=>void>(()=>{});

export function ToastProvider({children}:{children:React.ReactNode}) {
  const [items, setItems] = useState<Toast[]>([]);
  
  function push(text:string) {
    const id = Date.now();
    setItems(prev => [...prev, {id, text}]);
    setTimeout(()=> setItems(prev => prev.filter(x=>x.id!==id)), 1800);
  }
  
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {items.map(t => (
          <div key={t.id} className="px-3 py-2 rounded-xl bg-black/80 text-white text-sm shadow">
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
