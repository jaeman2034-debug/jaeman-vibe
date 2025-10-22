import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import Pagination from "../components/Pagination";
import SortSelect, { SortKey } from "../components/SortSelect";
import { haversineKm } from "../utils/geo";
import StorageImage from "../components/StorageImage";

type Job = {
  id: string;
  role: string;
  org: string;
  location: string;
  pay?: string;
  desc: string;
  lat: number;
  lng: number;
  images?: string[];
  createdAt: number;
};

const MOCK_JOBS: Job[] = [
  { id:"j1", role:"축구 코치", org:"YAGO FC U15", location:"서울/강동", pay:"시급 220~260", desc:"주말 훈련, 경기 진행", lat:37.55, lng:127.14, createdAt:Date.now()-1e6 },
  { id:"j2", role:"테니스 코치", org:"스포츠테니스클럽", location:"부산/해운대", pay:"시급 3.5만", desc:"주말 2회, 성인 초급", lat:35.16, lng:129.12, createdAt:Date.now()-3e6 },
];

export default function Jobs() {
  const [sort, setSort] = useState<SortKey>("newest");
  const [coords, setCoords] = useState<{lat:number;lng:number}|null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const nav = useNavigate();

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      pos => setCoords({lat:pos.coords.latitude,lng:pos.coords.longitude}),
      ()=>alert("위치 권한이 필요합니다")
    );
  };

  const onApply = (jobId: string) => {
    nav(`/jobs/${jobId}/apply`);
  };

  const enriched = useMemo(()=>MOCK_JOBS.map(j=>({
    ...j, distanceKm: coords ? haversineKm(coords, {lat:j.lat,lng:j.lng}) : null
  })),[coords]);

  const sorted = useMemo(()=>{
    const arr=[...enriched];
    if (sort==="distanceAsc") arr.sort((a,b)=>(a.distanceKm??1e9)-(b.distanceKm??1e9));
    else if (sort==="priceAsc" || sort==="priceDesc") return arr; // 급여 정렬은 케이스 복잡해서 생략
    else arr.sort((a,b)=>b.createdAt-a.createdAt);
    return arr;
  },[enriched,sort]);

  const total = sorted.length;
  const pageData = sorted.slice((page-1)*pageSize, page*pageSize);

  return (
    <>
      <div className="space-y-6">
        <section className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">구인·구직</h2>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost" onClick={useMyLocation}>내 위치</button>
            <SortSelect value={sort} onChange={setSort} withDistance />
            <Link to="/jobs/create" className="btn-primary">채용 공고 등록</Link>
          </div>
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          {pageData.map((j)=>{
            const imgUrl = Array.isArray(j.images) && j.images[0] ? j.images[0] : "";
            return (
              <div key={j.id} className="card">
                {/* 썸네일이 있으면 StorageImage, 없으면 플레이스홀더 */}
                {imgUrl ? (
                  <StorageImage
                    url={imgUrl}
                    alt={`${j.role} · ${j.org}`}
                    className="mb-3 h-40 w-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="mb-3 h-40 w-full rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <div className="text-2xl mb-2">💼</div>
                      <div className="text-sm">이미지 없음</div>
                    </div>
                  </div>
                )}
                <div className="font-semibold">{j.role} · {j.org}</div>
                <div className="text-sm text-slate-600">{j.desc}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {[j.location, j.distanceKm!=null?`${j.distanceKm.toFixed(1)}km`:null].filter(Boolean).join(" · ")}
                </div>
                {j.pay && <div className="mt-1 font-bold text-blue-600">{j.pay}</div>}
                <div className="flex justify-end mt-3">
                  <button 
                    className="btn-primary" 
                    onClick={() => onApply(j.id)}
                  >
                    지원하기
                  </button>
                </div>
              </div>
            );
          })}
        </section>
        <Pagination page={page} pageSize={pageSize} total={total} setPage={setPage} />
      </div>
      {/* 우하단 플로팅 채용 공고 등록 버튼 */}
      <Link
        to="/jobs/create"
        className="fixed bottom-6 right-6 rounded-full bg-green-600 px-5 py-3 text-white shadow-lg hover:bg-green-700 transition-colors duration-200 z-50"
      >
        + 채용 공고
      </Link>
    </>
  );
}