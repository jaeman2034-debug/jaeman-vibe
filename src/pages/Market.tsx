import { useNavigate } from "react-router-dom";

export default function Market() {
  const navigate = useNavigate();

  const products = [
    {
      id: "p1",
      title: "축구 ?�니??,
      desc: "FC 바이?�른 미넨 공식 ?�니?? ?�탁 ??�????�태",
      price: 25000,
      img: "/images/sample1.jpg",
    },
    {
      id: "p2",
      title: "?�디?�스 축구??,
      desc: "?�디?�스 ?�레?�터 축구?? ?�태 ?�호",
      price: 45000,
      img: "/images/sample2.jpg",
    },
    {
      id: "p3",
      title: "?�이??머큐리얼 축구??,
      desc: "?�품 ?�이??머큐리얼, ?�용�?거의 ?�음, ?�이�?270",
      price: 35000,
      img: "/images/sample3.jpg",
    },
  ];

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-3">?�� ?�포�??�품 거래</h1>
      <div className="grid grid-cols-2 gap-4">
        {products.map((p) => (
          <div
            key={p.id}
            onClick={() => navigate(`/market/${p.id}`)}
            className="cursor-pointer bg-white rounded-xl shadow hover:shadow-md transition p-3"
          >
            <img
              src={p.img}
              alt={p.title}
              className="w-full h-40 object-cover rounded-md mb-2"
              onError={(e) =>
                (e.currentTarget.src =
                  "https://via.placeholder.com/200x200?text=No+Image")
              }
            />
            <h2 className="font-semibold">{p.title}</h2>
            <p className="text-gray-500 text-sm">{p.desc}</p>
            <div className="text-green-600 font-bold mt-1">
              {p.price.toLocaleString()}??            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
