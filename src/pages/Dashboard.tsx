import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BottomTabNav from "../components/BottomTabNav";
import CategoryGrid from "../components/CategoryGrid";

// 카테고리 ?�이??(16�??�포�?종목 - 4x4 그리??
const sportCategories = [
  { name: "?�구", tag: "baseball", icon: "?? },
  { name: "축구", tag: "football", icon: "?? },
  { name: "?�구", tag: "basketball", icon: "??" },
  { name: "배구", tag: "volleyball", icon: "?��" },
  { name: "골프", tag: "golf", icon: "?���? },
  { name: "?�크골프", tag: "parkgolf", icon: "?��️‍♂�? },
  { name: "?�니??, tag: "tennis", icon: "?��" },
  { name: "?�닝", tag: "running", icon: "?��" },
  { name: "?�웃?�어", tag: "outdoor", icon: "?���? },
  { name: "배드민턴", tag: "badminton", icon: "?��" },
  { name: "?�구", tag: "tabletennis", icon: "?��" },
  { name: "?�영", tag: "swimming", icon: "?��" },
  { name: "?�스/?�트?�스", tag: "fitness", icon: "?���? },
  { name: "?��?/?�라?�스", tag: "yoga", icon: "?��" },
  { name: "?�라?�밍", tag: "climbing", icon: "?��" },
  { name: "기�?", tag: "etc", icon: "?��" },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const handleCategorySelect = (tag: string) => {
    // ?�릭 ???�당 카테고리�?마켓 ?�동
    window.location.href = `/market?category=${tag}`;
  };

  return (
    <div className="relative min-h-screen pb-20" style={{ backgroundColor: "#f8f9fb" }}>
      {/* ?�제 콘텐�?- 깔끔???�이??모드 */}
      <div className="relative max-w-7xl mx-auto px-4 py-8 my-4 rounded-2xl" style={{ backgroundColor: "rgba(255, 255, 255, 0.98)", boxShadow: "0 3px 10px rgba(0, 0, 0, 0.04)" }}>
        {/* ?�� YAGO SPORTS 브랜???�더 */}
        <header className="text-center mb-12">
          <motion.img
            src="/images/yago-logo.png"
            alt="YAGO SPORTS"
            className="w-20 h-20 mx-auto mb-3 rounded-xl shadow-sm"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            YAGO SPORTS
          </h1>
          <p className="text-gray-500 text-sm mb-1">
            AI Platform for Sports Enthusiasts
          </p>
          <p className="text-gray-600 text-xs">
            ?�포츠의 ?�작, ?�고 ??체육??커�??�티부???�터, 모임까�?!
          </p>
        </header>

        {/* ?�� ?�포�?카테고리 (4??고정 그리?? */}
        <section className="border-t border-gray-200 py-8">
          <h2 className="text-lg font-semibold mb-6 text-center tracking-tight">
            ?�� ?�포�?카테고리
          </h2>
          <div className="
            grid 
            grid-cols-4 
            gap-4 
            sm:gap-5 
            max-w-5xl 
            mx-auto 
            px-3 
            sm:px-4 
            place-items-center
          ">
            {sportCategories.map((c) => (
              <motion.button
                key={c.tag}
                onClick={() => handleCategorySelect(c.tag)}
                className="
                  flex flex-col items-center justify-center 
                  w-full aspect-[5/4]
                  rounded-xl border border-gray-200
                  bg-white
                  hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100
                  hover:border-blue-300
                  hover:shadow-md
                  active:scale-95
                  transition-all duration-200 ease-out
                  text-center
                  shadow-sm
                "
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-3xl sm:text-4xl mb-1 sm:mb-2 drop-shadow-sm transition-transform duration-150">
                  {c.icon}
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-700">{c.name}</span>
              </motion.button>
            ))}
          </div>
        </section>
        
      </div>
      <BottomTabNav />
    </div>
  );
}
