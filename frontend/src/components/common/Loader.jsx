import React from 'react';

const Loader = ({ message = 'Loading records...' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '12px' }}>
      <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--accent-blue)' }}></i>
      <span style={{ color: 'var(--muted)', fontSize: '14px', fontWeight: 600 }}>{message}</span>
    </div>
  );
};

export default Loader;
