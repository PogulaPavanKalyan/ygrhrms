import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const [dropdownActive, setDropdownActive] = useState(false);

  if (!user) return null;

  const getDashboardTitle = () => {
    switch (user.role) {
      case 'MD':
        return 'Managing Director Dashboard';
      case 'HR':
        return 'HR Dashboard';
      case 'Manager':
        return 'Manager Dashboard';
      case 'TeamLead':
        return 'Team Lead Dashboard';
      default:
        return 'Employee Dashboard';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'YG';
    return name.slice(0, 2).toUpperCase();
  };

  const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

  return (
    <header>
      <div className="header-left">
        <Link to="/">
          <div className="logo-card">
            <img 
              src="/logo.png" 
              alt="YGR TEAM Logo" 
              style={{
                height: '48px',
                width: 'auto',
                objectFit: 'contain'
              }} 
            />
            <span className="logo-company-name">YGR TEAM</span>
          </div>
        </Link>
      </div>

      <div className="header-center">
        <h1 className="header-title">{getDashboardTitle()}</h1>
      </div>

      <div className="header-right">
        {/* Profile Dropdown Widget */}
        <div className="profile-dropdown-container">
          <div className="hr-profile" onClick={() => setDropdownActive(!dropdownActive)}>
            <div className="avatar-container">
              {user.profile_pic ? (
                <img 
                  src={user.profile_pic.startsWith('http') ? user.profile_pic : `${API_BASE}${user.profile_pic}`} 
                  className="user-profile-img" 
                  alt={user.username} 
                />
              ) : (
                <div className="initials-avatar">
                  {getInitials(user.first_name || user.username)}
                </div>
              )}
              <div className="online-indicator"></div>
            </div>
            <div className="hr-info">
              <span className="hr-name">{user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username}</span>
              <span className="role-badge-pill">{user.designation || user.role}</span>
            </div>
            <i className="fa-solid fa-chevron-down dropdown-arrow" style={{ transform: dropdownActive ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}></i>
          </div>

          <div className={`dropdown-menu ${dropdownActive ? 'active' : ''}`} style={{ display: dropdownActive ? 'flex' : 'none' }}>
            <Link to="/profile" onClick={() => setDropdownActive(false)}><i className="fa-solid fa-user"></i> My Profile</Link>
            <Link to="/attendance" onClick={() => setDropdownActive(false)}><i className="fa-solid fa-calendar-days"></i> My Attendance</Link>
            <Link to="/payslips" onClick={() => setDropdownActive(false)}><i className="fa-solid fa-file-invoice-dollar"></i> My Payslips</Link>
            <div className="dropdown-divider"></div>
            <a href="#" className="dropdown-logout" onClick={(e) => { e.preventDefault(); logout(); }}><i className="fa-solid fa-power-off"></i> Sign Out</a>
          </div>
        </div>

        {/* Quick Power Off button */}
        <a href="#" className="logout-btn" title="Logout" onClick={(e) => { e.preventDefault(); logout(); }}>
          <i className="fa-solid fa-power-off"></i>
        </a>
      </div>
    </header>
  );
};

export default Header;
