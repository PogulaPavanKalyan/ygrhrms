import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { attendanceApi } from '../services/api';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Accordion menu open/close states
  const [menus, setMenus] = useState({
    createAccountMenu: false,
    memberListMenu: false,
    accountsMenu: false,
    hrMenu: false,
    attendanceMenu: false,
    financeMenu: false,
  });

  // Attendance state for current day
  const [attendance, setAttendance] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  // Fetch attendance status
  const fetchAttendanceStatus = async () => {
    try {
      const res = await attendanceApi.getStatus();
      setAttendance(res.data);
    } catch (err) {
      console.error('Error fetching attendance status:', err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAttendanceStatus();
    }
  }, [user]);

  if (!user) return null;

  const toggleMenu = (menuName) => {
    setMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    try {
      const res = await attendanceApi.checkIn();
      setAttendance(res.data.attendance);
      alert('Checked in successfully!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Check-in failed');
    }
  };

  const handleCheckOut = async (e) => {
    e.preventDefault();
    try {
      const res = await attendanceApi.checkOut();
      setAttendance(res.data.attendance);
      alert('Checked out successfully!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Check-out failed');
    }
  };

  // Determine dashboard link path based on role
  const getDashboardPath = () => {
    switch (user.role) {
      case 'MD': return '/md-dashboard';
      case 'HR': return '/hr-dashboard';
      case 'Manager': return '/manager-dashboard';
      case 'TeamLead': return '/tl-dashboard';
      default: return '/employee-dashboard';
    }
  };

  return (
    <aside className="sidebar">
      {/* Dashboard Link */}
      <NavLink 
        to={getDashboardPath()} 
        className={({ isActive }) => isActive ? 'active' : ''}
      >
        <i className="fa-solid fa-gauge" style={{ color: '#3b82f6' }}></i>
        <span>Dashboard</span>
      </NavLink>

      {/* MD PERMISSIONS */}
      {user.role === 'MD' && (
        <>
          <div className="menu-item" onClick={() => toggleMenu('createAccountMenu')}>
            <span><i className="fa-solid fa-user-plus" style={{ color: '#f59e0b' }}></i> Create Account</span>
            <i className={`fa-solid fa-angle-down ${menus.createAccountMenu ? 'fa-rotate-180' : ''}`} style={{ marginLeft: 'auto', transition: 'transform 0.2s' }}></i>
          </div>
          <div className={`dropdown ${menus.createAccountMenu ? 'active' : ''}`}>
            <NavLink to="/register" className={({ isActive }) => isActive ? 'active' : ''}>
              <i className="fa-solid fa-user"></i> Register Account
            </NavLink>
          </div>

          <div className="menu-item" onClick={() => toggleMenu('memberListMenu')}>
            <span><i className="fa-solid fa-users" style={{ color: '#10b981' }}></i> Member List</span>
            <i className={`fa-solid fa-angle-down ${menus.memberListMenu ? 'fa-rotate-180' : ''}`} style={{ marginLeft: 'auto', transition: 'transform 0.2s' }}></i>
          </div>
          <div className={`dropdown ${menus.memberListMenu ? 'active' : ''}`}>
            <NavLink to="/hr-list" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-user-tie"></i> HR List</NavLink>
            <NavLink to="/manager-list" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-briefcase"></i> Manager List</NavLink>
            <NavLink to="/tl-list" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-sitemap"></i> Team Lead List</NavLink>
            <NavLink to="/employee-list" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-user"></i> Employee List</NavLink>
          </div>

          <NavLink to="/leave-dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-calendar-minus" style={{ color: '#8b5cf6' }}></i>
            <span>Leaves</span>
          </NavLink>
          <NavLink to="/project-dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-folder-open" style={{ color: '#14b8a6' }}></i>
            <span>Projects</span>
          </NavLink>
          <NavLink to="/attendance-list" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-calendar-check" style={{ color: '#eab308' }}></i>
            <span>Daily Attendance</span>
          </NavLink>
          <NavLink to="/monthly-attendance" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-calendar" style={{ color: '#a855f7' }}></i>
            <span>Monthly Attendance</span>
          </NavLink>
          <NavLink to="/all-leaves" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-clipboard-check" style={{ color: '#22c55e' }}></i>
            <span>All Leaves</span>
          </NavLink>
          <NavLink to="/attendance-approvals" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-circle-check" style={{ color: '#06b6d4' }}></i>
            <span>Attendance Approvals</span>
          </NavLink>
          <NavLink to="/holiday-approvals" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-umbrella" style={{ color: '#f59e0b' }}></i>
            <span>Holiday Approvals</span>
          </NavLink>
        </>
      )}

      {/* HR PERMISSIONS */}
      {user.role === 'HR' && (
        <>
          <div className="menu-item" onClick={() => toggleMenu('accountsMenu')}>
            <span><i className="fa-solid fa-users-gear" style={{ color: '#ec4899' }}></i> Accounts</span>
            <i className={`fa-solid fa-angle-down ${menus.accountsMenu ? 'fa-rotate-180' : ''}`} style={{ marginLeft: 'auto', transition: 'transform 0.2s' }}></i>
          </div>
          <div className={`dropdown ${menus.accountsMenu ? 'active' : ''}`}>
            <NavLink to="/manager-register" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-user-tie"></i> Manager</NavLink>
            <NavLink to="/teamlead-register" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-user-shield"></i> Team Lead</NavLink>
            <NavLink to="/employee-register" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-user"></i> Employee</NavLink>
          </div>

          <div className="menu-item" onClick={() => toggleMenu('hrMenu')}>
            <span><i className="fa-solid fa-users" style={{ color: '#f59e0b' }}></i> HR Tools</span>
            <i className={`fa-solid fa-angle-down ${menus.hrMenu ? 'fa-rotate-180' : ''}`} style={{ marginLeft: 'auto', transition: 'transform 0.2s' }}></i>
          </div>
          <div className={`dropdown ${menus.hrMenu ? 'active' : ''}`}>
            <NavLink to="/leave-status" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-calendar-check"></i> Leave Portal</NavLink>
            <NavLink to="/hr-approved-leaves" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-clipboard-check"></i> HR Approved Leaves</NavLink>
            <NavLink to="/leave-requests" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-calendar-minus"></i> All Leave Requests</NavLink>
          </div>

          <div className="menu-item" onClick={() => toggleMenu('attendanceMenu')}>
            <span><i className="fa-solid fa-calendar-check" style={{ color: '#eab308' }}></i> Attendance</span>
            <i className={`fa-solid fa-angle-down ${menus.attendanceMenu ? 'fa-rotate-180' : ''}`} style={{ marginLeft: 'auto', transition: 'transform 0.2s' }}></i>
          </div>
          <div className={`dropdown ${menus.attendanceMenu ? 'active' : ''}`}>
            <NavLink to="/attendance-list" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-clipboard-user"></i> Daily Registry</NavLink>
            <NavLink to="/monthly-attendance" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-calendar-days"></i> Monthly Summary</NavLink>
            <NavLink to="/attendance-correct" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-pen-to-square"></i> Correction (Single)</NavLink>
            <NavLink to="/attendance-correct-bulk" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-layer-group"></i> Correction (Bulk)</NavLink>
            <NavLink to="/attendance" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-calendar-check"></i> My Attendance</NavLink>
          </div>

          <div className="menu-item" onClick={() => toggleMenu('financeMenu')}>
            <span><i className="fa-solid fa-wallet" style={{ color: '#10b981' }}></i> Finance</span>
            <i className={`fa-solid fa-angle-down ${menus.financeMenu ? 'fa-rotate-180' : ''}`} style={{ marginLeft: 'auto', transition: 'transform 0.2s' }}></i>
          </div>
          <div className={`dropdown ${menus.financeMenu ? 'active' : ''}`}>
            <NavLink to="/invoices" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-file-invoice-dollar"></i> Invoices</NavLink>
            <NavLink to="/client-create" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-user-plus"></i> Create Client</NavLink>
            <NavLink to="/service-create" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-gears"></i> Create Service</NavLink>
            <NavLink to="/invoice-create" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-receipt"></i> Create Invoice</NavLink>
            <NavLink to="/salary-structures" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-calculator"></i> Salary Structures</NavLink>
            <NavLink to="/payslips-list" className={({ isActive }) => isActive ? 'active' : ''}><i className="fa-solid fa-file-invoice-dollar"></i> Payslips / Payroll</NavLink>
          </div>

          <NavLink to="/holidays" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-umbrella-beach" style={{ color: '#ef4444' }}></i>
            <span>Holiday Calendar</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-gear" style={{ color: '#8b5cf6' }}></i>
            <span>HR Settings</span>
          </NavLink>
          <NavLink to="/questions" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-circle-question" style={{ color: '#8b5cf6' }}></i>
            <span>Questions</span>
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-list-check" style={{ color: '#22c55e' }}></i>
            <span>Tasks & Reports</span>
          </NavLink>
        </>
      )}

      {/* MANAGER PERMISSIONS */}
      {user.role === 'Manager' && (
        <>
          <NavLink to="/teams" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-users-gear" style={{ color: '#f59e0b' }}></i>
            <span>Teams</span>
          </NavLink>
          <NavLink to="/employees" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-users" style={{ color: '#14b8a6' }}></i>
            <span>Employees</span>
          </NavLink>
          <NavLink to="/leave-status" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-calendar-check" style={{ color: '#6366f1' }}></i>
            <span>Leave Portal</span>
          </NavLink>
          <NavLink to="/manager-approved-leaves" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-clipboard-check" style={{ color: '#eab308' }}></i>
            <span>Manager Approved Leaves</span>
          </NavLink>
          <NavLink to="/leave-requests" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-calendar-minus" style={{ color: '#f43f5e' }}></i>
            <span>TeamLead/Emp Leaves</span>
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-list-check" style={{ color: '#a855f7' }}></i>
            <span>Tasks & Reports</span>
          </NavLink>
          <NavLink to="/attendance-list" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-calendar-check" style={{ color: '#eab308' }}></i>
            <span>Team Attendance</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-user-circle" style={{ color: '#6366f1' }}></i>
            <span>My Profile</span>
          </NavLink>
          <NavLink to="/attendance" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-calendar-check" style={{ color: '#06b6d4' }}></i>
            <span>My Attendance</span>
          </NavLink>
          <NavLink to="/payslips" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-file-invoice-dollar" style={{ color: '#10b981' }}></i>
            <span>My Payslips</span>
          </NavLink>
        </>
      )}

      {/* TEAM LEAD PERMISSIONS */}
      {user.role === 'TeamLead' && (
        <>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-user-circle" style={{ color: '#6366f1' }}></i>
            <span>My Profile</span>
          </NavLink>
          <NavLink to="/attendance" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-calendar-check" style={{ color: '#06b6d4' }}></i>
            <span>My Attendance</span>
          </NavLink>
          <NavLink to="/attendance-list" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-calendar-check" style={{ color: '#eab308' }}></i>
            <span>Team Attendance</span>
          </NavLink>
          <NavLink to="/payslips" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-file-invoice-dollar" style={{ color: '#10b981' }}></i>
            <span>My Payslips</span>
          </NavLink>
          <NavLink to="/holidays" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-calendar-days" style={{ color: '#f43f5e' }}></i>
            <span>Attendance Calendar</span>
          </NavLink>
          <NavLink to="/leave-status" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-calendar-check" style={{ color: '#6366f1' }}></i>
            <span>Leave Portal</span>
          </NavLink>
          <NavLink to="/tl-approved-leaves" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-clipboard-check" style={{ color: '#14b8a6' }}></i>
            <span>TL Approved Leaves</span>
          </NavLink>
          <NavLink to="/leave-requests" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-calendar-minus" style={{ color: '#f43f5e' }}></i>
            <span>Employee Leaves</span>
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-list-check" style={{ color: '#22c55e' }}></i>
            <span>Tasks & Reports</span>
          </NavLink>
        </>
      )}

      {/* EMPLOYEE PERMISSIONS */}
      {user.role === 'Employee' && (
        <>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-user-circle" style={{ color: '#6366f1' }}></i>
            <span>My Profile</span>
          </NavLink>
          <NavLink to="/attendance" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-calendar-check" style={{ color: '#06b6d4' }}></i>
            <span>My Attendance</span>
          </NavLink>
          <NavLink to="/payslips" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-file-invoice-dollar" style={{ color: '#10b981' }}></i>
            <span>My Payslips</span>
          </NavLink>
          <NavLink to="/holidays" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-calendar-days" style={{ color: '#f43f5e' }}></i>
            <span>Attendance Calendar</span>
          </NavLink>
          <NavLink to="/leave-status" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-calendar-check" style={{ color: '#6366f1' }}></i>
            <span>Leave Portal</span>
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => isActive ? 'active' : ''}>
            <i className="fa-solid fa-list-check" style={{ color: '#22c55e' }}></i>
            <span>Tasks & Reports</span>
          </NavLink>
        </>
      )}

      {/* Messages */}
      <NavLink to="/messages" className={({ isActive }) => isActive ? 'active' : ''}>
        <i className="fa-solid fa-comments" style={{ color: '#06b6d4' }}></i>
        <span>Messages</span>
      </NavLink>

      {/* Check In / Out Footer block inside sidebar */}
      <div className="sidebar-footer">
        {loadingAttendance ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>
            <i className="fa-solid fa-spinner fa-spin"></i> Loading...
          </div>
        ) : attendance && attendance.check_in_time && !attendance.check_out_time ? (
          <button className="checkout-btn" onClick={handleCheckOut}>
            <i className="fa-solid fa-circle-xmark"></i> Check Out
          </button>
        ) : attendance && attendance.check_in_time && attendance.check_out_time ? (
          <button className="checkin-btn" style={{ background: '#10b981', cursor: 'default' }} disabled>
            <i className="fa-solid fa-circle-check"></i> Done today
          </button>
        ) : (
          <button className="checkin-btn" onClick={handleCheckIn}>
            <i className="fa-solid fa-circle-check"></i> Check In
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
