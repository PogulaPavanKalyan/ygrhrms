import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to role-specific dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRedirects = {
        Employee: '/employee-dashboard',
        TeamLead: '/tl-dashboard',
        Manager: '/manager-dashboard',
        HR: '/hr-dashboard',
        MD: '/md-dashboard',
      };
      navigate(roleRedirects[user.role] || '/employee-dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    const result = await login(username, password, rememberMe);
    if (!result.success) {
      setErrorMsg(result.error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page-wrapper">
      <style>{`
        .login-page-wrapper {
          --primary: #092a49;
          --primary-light: #1e4d7b;
          --accent: #3b82f6;
          --success: #10b981;
          --danger: #ef4444;
          --bg: #f8fafc;
          --card: #ffffff;
          --border: #e2e8f0;
          --text: #0f172a;
          --muted: #64748b;
          --font: 'Plus Jakarta Sans', 'Outfit', sans-serif;
          
          font-family: var(--font);
          background: linear-gradient(135deg, #092a49 0%, #1e3c72 50%, #2a5298 100%);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
          overflow: hidden;
          position: relative;
          width: 100%;
          box-sizing: border-box;
        }

        .login-page-wrapper::before, .login-page-wrapper::after {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0,0,0,0) 70%);
          z-index: 1;
          pointer-events: none;
          filter: blur(40px);
        }
        .login-page-wrapper::before { top: -100px; left: -100px; }
        .login-page-wrapper::after { bottom: -100px; right: -100px; }

        .login-container {
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
          z-index: 2;
          animation: fadeIn 0.4s ease-out;
          position: relative;
          box-sizing: border-box;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .brand-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .brand-logo {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, var(--accent), var(--primary));
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 1.8rem;
          margin-bottom: 16px;
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .brand-name {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }
        .welcome-msg {
          font-size: 0.9rem;
          color: var(--muted);
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 22px;
          position: relative;
          text-align: left;
        }
        .form-group label {
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-wrapper i.field-icon {
          position: absolute;
          left: 14px;
          color: var(--muted);
          font-size: 1rem;
          transition: color 0.2s;
        }
        .input-control {
          width: 100%;
          padding: 13px 16px 13px 42px;
          border: 1.5px solid var(--border);
          border-radius: 12px;
          font-size: 0.92rem;
          color: var(--text);
          background: var(--bg);
          outline: none;
          transition: 0.2s;
          box-sizing: border-box;
        }
        .input-control:focus {
          border-color: var(--accent);
          background: #fff;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .input-control:focus + i.field-icon {
          color: var(--accent);
        }
        
        .toggle-password {
          position: absolute;
          right: 14px;
          color: var(--muted);
          cursor: pointer;
          font-size: 0.95rem;
          padding: 4px;
          transition: color 0.2s;
        }
        .toggle-password:hover {
          color: var(--text);
        }

        .form-helpers {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 26px;
          font-size: 0.85rem;
        }
        .remember-me {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: var(--muted);
          font-weight: 600;
          user-select: none;
        }
        .remember-me input {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1.5px solid var(--border);
          accent-color: var(--accent);
          cursor: pointer;
        }
        .forgot-pass {
          color: var(--accent);
          text-decoration: none;
          font-weight: 700;
          transition: 0.15s;
        }
        .forgot-pass:hover {
          text-decoration: underline;
        }

        .btn-login {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary), var(--primary-light));
          color: #fff;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(9, 42, 73, 0.2);
          transition: 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-login:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(9, 42, 73, 0.3);
          filter: brightness(1.1);
        }
        .btn-login:active {
          transform: translateY(0);
        }

        .msg-alert {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: shake 0.3s ease;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .login-footer {
          margin-top: 25px;
          text-align: center;
          font-size: 0.76rem;
          color: var(--muted);
          font-weight: 600;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
      `}</style>

      <div className="login-container">
        <div className="brand-header">
          <img 
            src="/logo.png" 
            alt="YGR TEAM Logo" 
            style={{
              height: '80px',
              width: 'auto',
              objectFit: 'contain',
              marginBottom: '16px'
            }} 
          />
          <div className="brand-name">YGR Gobal IT Services</div>
          <div className="welcome-msg">Welcome to YGR HRMS Portal</div>
        </div>

        {errorMsg && (
          <div className="msg-alert">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Employee ID / Email</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="username"
                className="input-control"
                required
                placeholder="Enter ID or email..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
              <i className="fa-regular fa-user field-icon"></i>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="input-control"
                required
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <i className="fa-solid fa-lock field-icon"></i>
              <i
                className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-password`}
                onClick={togglePasswordVisibility}
              ></i>
            </div>
          </div>

          <div className="form-helpers">
            <label className="remember-me">
              <input
                type="checkbox"
                id="remember_me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>
            <a
              href="#"
              className="forgot-pass"
              onClick={(e) => {
                e.preventDefault();
                alert('Please contact the HR Administrator to reset your password.');
              }}
            >
              Forgot Password?
            </a>
          </div>

          <button type="submit" className="btn-login">
            <i className="fa-solid fa-right-to-bracket"></i> Secure Log In
          </button>
        </form>

        <div className="login-footer">
          <span>Version v2.4.1</span>
          <span>&copy; {new Date().getFullYear()} YGR IT Services. All Rights Reserved.</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
