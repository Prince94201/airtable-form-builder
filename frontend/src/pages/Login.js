import React from 'react';

function Login() {
  const handleLogin = () => {
    window.location.href = `https://airtable-form-builder-xqkq.onrender.com/auth/airtable`;
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Airtable Form Builder</h1>
      <p>Create dynamic forms with conditional logic</p>
      <button 
        onClick={handleLogin}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px'
        }}
      >
        Login with Airtable
      </button>
    </div>
  );
}

export default Login;