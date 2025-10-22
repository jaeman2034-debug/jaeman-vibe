import { useState } from "react";

export default function Tooltip({label, children}:{label:string; children:React.ReactNode}) {
  const [show,setShow]=useState(false);
  
  return (
    <span className="relative inline-block" onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      {children}
      {show && (
        <span className="absolute left-1/2 -translate-x-1/2 bottom-[120%] whitespace-nowrap px-2 py-1 rounded bg-black text-white text-[11px] shadow z-10">
          {label}
        </span>
      )}
    </span>
  );
}
