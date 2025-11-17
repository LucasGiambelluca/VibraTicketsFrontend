import React from 'react';

const HeroBanner = () => {
  return (
    <div style={{
      width: '100%',
      height: '500px',
      backgroundImage: 'url(https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      textAlign: 'center',
      textShadow: '0 2px 8px rgba(0,0,0,0.7)'
    }}>
    </div>
  );
};

export default HeroBanner;
