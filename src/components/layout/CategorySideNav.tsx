import { useNavigate, useParams, useLocation } from "react-router-dom";

type TabKey = "overview"|"market"|"clubs"|"jobs"|"events"|"facilities";

export default function CategorySideNav() {
  const { slug } = useParams();
  const nav = useNavigate();
  const cur = (new URLSearchParams(useLocation().search).get("tab") as TabKey) || "overview";
  
  const go = (k: TabKey) => (e: React.MouseEvent) => { 
    // preventDefault ?�거 - NavLink 기본 ?�작 ?�용
    nav({ pathname:`/admin/category/${slug}`, search:`?tab=${k}` }); 
  };
  
  const Item = (k:TabKey, label:string) => (
    <button 
      onClick={go(k)} 
      className={`w-full text-left px-3 py-2 rounded-lg ${cur===k?'bg-blue-100 text-blue-700':'hover:bg-gray-50'}`}
    >
      {label}
    </button>
  );
  
  return (
    <nav className="relative z-40 p-2 space-y-1">
      {Item("overview","개요")}
      {Item("market","마켓")}
      {Item("clubs","모임")}
      {Item("jobs","구인·구직")}
      {Item("events","?�벤???�슨")}
      {Item("facilities","?�설")}
      <button 
        onClick={()=>nav("/admin/categories")} 
        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 mt-2"
      >
        ?�영?�?�보??
      </button>
    </nav>
  );
}
