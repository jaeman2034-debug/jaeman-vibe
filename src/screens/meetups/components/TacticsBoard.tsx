import { useRef, useState } from 'react';

const POS = [ [20,20],[40,20],[60,20],[80,20],[20,80],[40,80],[60,80],[80,80] ];
export default function TacticsBoard(){
  const [pts, setPts] = useState(POS.map(([x,y])=>({x,y})));
  const svgRef = useRef<SVGSVGElement|null>(null);

  const onDrag = (i:number, e:any)=>{
    const rect = (e.target as SVGCircleElement).ownerSVGElement!.getBoundingClientRect();
    const x = ((e.clientX-rect.left)/rect.width)*100; 
    const y = ((e.clientY-rect.top)/rect.height)*100;
    setPts(p=> p.map((pt,idx)=> idx===i? {x:Math.max(0,Math.min(100,x)), y:Math.max(0,Math.min(100,y))} : pt));
  };

  const downloadPng = async ()=>{
    const svg = svgRef.current!;
    const s = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([s], {type:'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const img = new Image(); 
    img.src = url; 
    await img.decode();
    const canvas = document.createElement('canvas'); 
    canvas.width=800; 
    canvas.height=500;
    const ctx = canvas.getContext('2d')!; 
    ctx.fillStyle='#0a0a0a'; 
    ctx.fillRect(0,0,800,500); 
    ctx.drawImage(img,0,0,800,500);
    const a = document.createElement('a'); 
    a.href = canvas.toDataURL('image/png'); 
    a.download = 'tactics.png'; 
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="text-sm text-gray-500 mb-1">전술 화이트보드</div>
      <svg ref={svgRef} viewBox="0 0 100 60" className="w-full rounded-2xl border bg-black">
        {/* 코트 라인 */}
        <rect x="1" y="1" width="98" height="58" fill="none" stroke="#3b82f6" strokeWidth="0.5"/>
        <line x1="50" y1="1" x2="50" y2="59" stroke="#3b82f6" strokeWidth="0.4"/>
        {pts.map((p,i)=> (
          <circle key={i} cx={p.x} cy={p.y} r="2.2" fill="#f59e0b"
            onPointerDown={e=> (e.currentTarget.setPointerCapture(e.pointerId))}
            onPointerMove={e=> e.buttons===1 && onDrag(i, e)} />
        ))}
      </svg>
      <button className="btn mt-2" onClick={downloadPng}>PNG 내보내기</button>
    </div>
  );
}
