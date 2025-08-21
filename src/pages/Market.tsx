import { Link } from 'react-router-dom';
export default function Market(){
  return (
    <div style={{padding:24}}>
      <h2>🛒 Market</h2>
      <Link to="/market/new"><button>+ 상품 등록</button></Link>
    </div>
  );
} 