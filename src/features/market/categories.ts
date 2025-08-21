export type SportCode = "BSB"|"SOC"|"BSK"|"RAC"|"GLF"|"RUN"|"SNW"|"OUT";

export const sportLabels: Record<SportCode,string> = {
  BSB:"야구", SOC:"축구", BSK:"농구", RAC:"라켓", GLF:"골프", RUN:"러닝", SNW:"겨울", OUT:"아웃도어",
};

export type CatNode = { code: string; label: string; children?: CatNode[]; };
export type SportTree = { sport: SportCode; label: string; nodes: CatNode[]; };

export const categoryTree: SportTree[] = [
  { sport:"SOC", label:sportLabels.SOC, nodes:[
    { code:"SOC-SHO", label:"축구화", children:[
      {code:"SOC-SHO-FG", label:"FG"}, {code:"SOC-SHO-AG", label:"AG"},
      {code:"SOC-SHO-TF", label:"TF"}, {code:"SOC-SHO-IC", label:"IC"},
    ]},
    { code:"SOC-BAL", label:"공/펌프" },
    { code:"SOC-GKP", label:"골키퍼 장비" },
    { code:"SOC-PRO", label:"보호대" },
    { code:"SOC-APP", label:"의류" },
    { code:"SOC-BAG", label:"가방" },
    { code:"SOC-TRN", label:"훈련용품" },
  ]},
  { sport:"BSB", label:sportLabels.BSB, nodes:[
    { code:"BSB-BAT", label:"배트", children:[
      {code:"BSB-BAT-WOD", label:"목재"},
      {code:"BSB-BAT-AL",  label:"알루미늄/합금"},
      {code:"BSB-BAT-CAR", label:"카본"}
    ]},
    { code:"BSB-GLV", label:"글러브", children:[
      {code:"BSB-GLV-INF", label:"내야"},
      {code:"BSB-GLV-OF",  label:"외야"},
      {code:"BSB-GLV-PIT", label:"투수"},
      {code:"BSB-GLV-1B",  label:"1루"},
      {code:"BSB-GLV-CST", label:"포수"}
    ]},
    { code:"BSB-PRO", label:"보호장비" },
    { code:"BSB-SHO", label:"신발" },
    { code:"BSB-APP", label:"의류" },
    { code:"BSB-BAG", label:"가방" },
    { code:"BSB-TRN", label:"훈련용품" },
  ]},
  { sport:"BSK", label:sportLabels.BSK, nodes:[
    { code:"BSK-SHO", label:"농구화" },
    { code:"BSK-BAL", label:"공" },
    { code:"BSK-PRO", label:"보호대" },
    { code:"BSK-APP", label:"의류" },
    { code:"BSK-BAG", label:"가방" },
  ]},
  { sport:"RAC", label:sportLabels.RAC, nodes:[
    { code:"RAC-RKT", label:"라켓", children:[
      {code:"RAC-RKT-TEN", label:"테니스"},
      {code:"RAC-RKT-BAD", label:"배드민턴"},
      {code:"RAC-RKT-SQH", label:"스쿼시"}
    ]},
    { code:"RAC-STR", label:"스트링" },
    { code:"RAC-GRP", label:"그립" },
    { code:"RAC-BAL", label:"공/셔틀" },
    { code:"RAC-SHO", label:"신발" },
    { code:"RAC-BAG", label:"가방" },
  ]},
  { sport:"GLF", label:sportLabels.GLF, nodes:[
    { code:"GLF-CLB", label:"클럽", children:[
      {code:"GLF-CLB-DRI", label:"드라이버"},
      {code:"GLF-CLB-WOOD",label:"우드/유틸"},
      {code:"GLF-CLB-IRN", label:"아이언/웨지"},
      {code:"GLF-CLB-PTR", label:"퍼터"},
    ]},
    { code:"GLF-BAL", label:"공" },
    { code:"GLF-GPS", label:"거리측정/GPS" },
    { code:"GLF-BAG", label:"가방" },
    { code:"GLF-APP", label:"의류/장갑" },
  ]},
  { sport:"RUN", label:sportLabels.RUN, nodes:[
    { code:"RUN-SHO", label:"러닝화" },
    { code:"RUN-WAT", label:"워치/밴드" },
    { code:"RUN-RCV", label:"회복/마사지" },
  ]},
  { sport:"SNW", label:sportLabels.SNW, nodes:[
    { code:"SNW-BRD", label:"보드/스키" },
    { code:"SNW-PRO", label:"보호대/헬멧/고글" },
    { code:"SNW-APP", label:"의류" },
  ]},
  { sport:"OUT", label:sportLabels.OUT, nodes:[
    { code:"OUT-TNT", label:"텐트/체어/테이블" },
    { code:"OUT-BPK", label:"백팩/하이킹" },
    { code:"OUT-SWM", label:"수영/서핑" },
  ]},
];

export function sportLabel(code?: SportCode|null) { return code ? sportLabels[code] : ""; }

export function flattenCategories(tree = categoryTree) {
  const out: {code:string; label:string; sport:SportCode}[] = [];
  for (const t of tree) {
    const walk = (node: CatNode) => {
      out.push({ code: node.code, label: node.label, sport: t.sport });
      node.children?.forEach(walk);
    };
    t.nodes.forEach(walk);
  }
  return out;
}

export function categoryLabel(code?: string|null) {
  if (!code) return "";
  const f = flattenCategories();
  return f.find(x => x.code === code)?.label ?? code;
} 