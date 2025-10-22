import { useNavigate } from "react-router-dom";

export default function Market() {
  const navigate = useNavigate();

  const products = [
    {
      id: "p1",
      title: "μ¶•κµ¬ ? λ‹??,
      desc: "FC λ°”μ΄?λ¥Έ λ―Έλ„¨ κ³µμ‹ ? λ‹?? ?Ένƒ ??λ²????νƒ",
      price: 25000,
      img: "/images/sample1.jpg",
    },
    {
      id: "p2",
      title: "?„λ””?¤μ¤ μ¶•κµ¬??,
      desc: "?„λ””?¤μ¤ ?„λ ?°ν„° μ¶•κµ¬?? ?νƒ ?‘νΈ",
      price: 45000,
      img: "/images/sample2.jpg",
    },
    {
      id: "p3",
      title: "?μ΄??λ¨Ένλ¦¬μ–Ό μ¶•κµ¬??,
      desc: "?•ν’ ?μ΄??λ¨Ένλ¦¬μ–Ό, ?¬μ©κ°?κ±°μ ?†μ, ?¬μ΄μ¦?270",
      price: 35000,
      img: "/images/sample3.jpg",
    },
  ];

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-3">?† ?¤ν¬μΈ??©ν’ κ±°λ</h1>
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
