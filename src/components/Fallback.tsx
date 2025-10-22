import React from 'react';

// Suspense fallback???€?„ì•„???ˆë‚´ ì¶”ê? (?¬ìš©??ê²½í—˜ ê°œì„ )
export function Fallback() {
  const [slow, setSlow] = React.useState(false);
  
  React.useEffect(() => {
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, []);
  
  return (
    <div style={{ 
      padding: 32, 
      textAlign: 'center',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ 
        width: 48, 
        height: 48, 
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #007bff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: 16
      }}></div>
      <p style={{ fontSize: 18, color: '#666', margin: 0 }}>
        ë¡œë”© ì¤‘â€?{slow && '(?ë¦¬?¤ìš”. ?ˆë¡œê³ ì¹¨ ?´ë„ ì¢‹ì•„??'}
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
