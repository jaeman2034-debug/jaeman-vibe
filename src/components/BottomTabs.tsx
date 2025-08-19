import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';

const tabBase =
  'px-3 py-2 rounded-lg';

export default function BottomTabs() {
  const { user } = useAuth();
  return (
    <nav
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0,
        display: 'flex', gap: 8, justifyContent: 'space-around',
        padding: '10px', borderTop: '1px solid #eee', background: '#fff',
        zIndex: 50
      }}
    >
      <NavLink to="/home" className={({isActive}) => `${tabBase} ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>홈</NavLink>
      <NavLink to="/market" className={({isActive}) => `${tabBase} ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>마켓</NavLink>
      <NavLink to="/jobs" className={({isActive}) => `${tabBase} ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>일자리</NavLink>
      <NavLink to="/groups" className={({isActive}) => `${tabBase} ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>모임</NavLink>
      <NavLink to="/my" className={({isActive}) => `${tabBase} ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>마이</NavLink>
      {user && (
        <Link to="/products/new" className={`${tabBase} border`}>
          판매 등록
        </Link>
      )}
    </nav>
  );
} 