import { Link, useLocation } from 'react-router-dom';
import { getUid } from '../lib/auth';

const tabBase = 'px-3 py-2 rounded-lg';

export default function BottomTabs() {
  const uid = getUid();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0,
        display: 'flex', gap: 8, justifyContent: 'space-around',
        padding: '10px', borderTop: '1px solid #eee', background: '#fff',
        zIndex: 50
      }}
    >
      <Link 
        to="/home" 
        className={`${tabBase} ${isActive('/home') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-600 hover:text-white'}`}
      >
        ??
      </Link>
      
      <Link 
        to="/market" 
        className={`${tabBase} ${isActive('/market') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-600 hover:text-white'}`}
      >
        마켓
      </Link>
      
      <Link 
        to="/chat" 
        className={`${tabBase} ${isActive('/chat') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-600 hover:text-white'}`}
      >
        채팅
      </Link>
      
      <Link 
        to="/jobs" 
        className={`${tabBase} ${isActive('/jobs') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-600 hover:text-white'}`}
      >
        구자�?
      </Link>
      
      <Link 
        to="/meetups" 
        className={`${tabBase} ${isActive('/meetups') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-600 hover:text-white'}`}
      >
        모임
      </Link>
      
      {uid && (
        <Link 
          to="/my/products" 
          className={`${tabBase} ${isActive('/my/products') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-600 hover:text-white'}`}
        >
          ???�품
        </Link>
      )}
      
      <Link 
        to="/my" 
        className={`${tabBase} ${isActive('/my') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-600 hover:text-white'}`}
      >
        마이
      </Link>
      
      {uid && (
        <Link to="/market/create" className={`${tabBase} border`}>
          ?�매 ?�록
        </Link>
      )}
    </nav>
  );
}
