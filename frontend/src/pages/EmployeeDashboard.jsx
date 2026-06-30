import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Good day');
  const [liveTime, setLiveTime] = useState('');
  
  // Accordion active menu keys
  const [teamAccordionOpen, setTeamAccordionOpen] = useState(false);
  const [openMemberAccordion, setOpenMemberAccordion] = useState({});

  // Fetch data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/api/dashboard/employee/');
        setDashboardData(res.data);
      } catch (err) {
        console.error('Error loading employee dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Update clock & greeting
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      // Clock
      const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
      setLiveTime(now.toLocaleTimeString('en-US', timeOptions));
      
      // Greeting
      const hour = now.getHours();
      if (hour >= 5 && hour < 12) {
        setGreeting('Good morning');
      } else if (hour >= 12 && hour < 17) {
        setGreeting('Good afternoon');
      } else {
        setGreeting('Good evening');
      }
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleMemberAccordion = (memberId) => {
    setOpenMemberAccordion((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const getAvatarGradient = (name) => {
    const colors = [
      'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Blue
      'linear-gradient(135deg, #10b981 0%, #047857 100%)', // Emerald
      'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', // Indigo
      'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', // Purple
      'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', // Pink
      'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', // Amber
      'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)', // Teal
    ];
    let hash = 0;
    if (name) {
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: 'var(--muted)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginRight: '10px' }}></i> Loading dashboard...
      </div>
    );
  }

  return (
    <div className="employee-dashboard-content">
      <style>{`
        /* HERO GREETING BANNER */
        .dashboard-hero {
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            border-radius: 12px;
            padding: 24px 32px;
            color: #ffffff;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03);
            margin-bottom: 24px;
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.08);
            min-height: 120px;
        }
        .dashboard-hero::before {
            content: '';
            position: absolute;
            top: -40px;
            right: -40px;
            width: 180px;
            height: 180px;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%);
            border-radius: 50%;
            pointer-events: none;
            filter: blur(10px);
        }
        .hero-left {
            position: relative;
            z-index: 2;
            text-align: left;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
        }
        .greeting-prefix {
            font-size: 0.65rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #818cf8;
            margin-bottom: 2px;
            display: block;
        }
        .welcome-title {
            font-size: 1.6rem;
            font-weight: 700;
            letter-spacing: -0.5px;
            line-height: 1.2;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            margin: 0;
            color: #ffffff;
        }
        .hero-role-badge {
            font-size: 0.65rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 3px 8px;
            border-radius: 4px;
            background: rgba(99, 102, 241, 0.15);
            color: #a5b4fc;
            border: 1px solid rgba(99, 102, 241, 0.2);
            margin-left: 6px;
            display: inline-flex;
            align-items: center;
        }
        .wave-emoji {
            display: inline-block;
            animation: wave-animation 2.5s infinite;
            transform-origin: 70% 70%;
        }
        @keyframes wave-animation {
            0% { transform: rotate( 0.0deg) }
            10% { transform: rotate(14.0deg) }
            20% { transform: rotate(-8.0deg) }
            30% { transform: rotate(14.0deg) }
            40% { transform: rotate(-4.0deg) }
            50% { transform: rotate(10.0deg) }
            60% { transform: rotate( 0.0deg) }
            100% { transform: rotate( 0.0deg) }
        }
        .hero-subtext {
            font-size: 0.88rem;
            color: #94a3b8;
            margin: 4px 0 0 0;
            font-weight: 400;
            line-height: 1.4;
            display: flex;
            align-items: center;
        }
        .hero-task-highlight {
            color: #818cf8;
            font-weight: 700;
            background: rgba(99, 102, 241, 0.1);
            padding: 2px 8px;
            border-radius: 4px;
            margin: 0 5px;
            font-size: 0.83rem;
        }
        .hero-date-widget {
            display: flex;
            align-items: center;
            gap: 12px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 8px 16px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
            position: relative;
            z-index: 2;
        }
        .hero-date-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.82rem;
            font-weight: 500;
            color: #94a3b8;
        }
        .hero-date-item i {
            color: #818cf8;
        }
        .hero-date-divider {
            width: 1px;
            height: 12px;
            background: rgba(255, 255, 255, 0.15);
        }
        .hero-time-val {
            font-weight: 700;
            color: #ffffff;
            font-family: monospace;
        }

        /* ===== CARDS ===== */
        .card {
            background: #ffffff;
            padding: 0;
            margin-bottom: 24px;
            border-radius: 12px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03);
            border: 1px solid #e8edf2;
            text-align: left;
            overflow: hidden;
            transition: box-shadow 0.25s ease;
        }
        .card:hover {
            box-shadow: 0 4px 20px rgba(0,0,0,0.07);
        }
        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 24px 16px;
            border-bottom: 1px solid #f1f5f9;
        }
        .card-title {
            font-family: var(--font-display);
            font-size: 0.95rem;
            font-weight: 700;
            color: #0f172a;
            display: flex;
            align-items: center;
            gap: 9px;
            margin: 0;
        }
        .card-title-icon {
            width: 30px;
            height: 30px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
        }
        .card-title-icon.blue {
            background: #eff6ff;
            color: #2563eb;
        }
        .card-title-icon.indigo {
            background: #eef2ff;
            color: #4f46e5;
        }
        .card-link {
            font-size: 0.82rem;
            color: #4f46e5;
            font-weight: 600;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 5px 10px;
            border-radius: 6px;
            transition: background 0.2s ease;
        }
        .card-link:hover {
            background: #eef2ff;
        }
        .card-body {
            padding: 20px 24px;
        }
        /* ===== PAYSLIP STATS ===== */
        .payslip-stats-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0;
            border: 1px solid #eef0f4;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 20px;
            background: #fafbfc;
        }
        .payslip-stat-cell {
            padding: 14px 18px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            transition: background 0.2s ease;
        }
        .payslip-stat-cell + .payslip-stat-cell {
            border-left: 1px solid #eef0f4;
        }
        .payslip-stat-cell:hover {
            background: #f1f5ff;
        }
        .payslip-stat-label {
            font-size: 0.68rem;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            font-weight: 700;
        }
        .payslip-stat-value {
            font-size: 1.05rem;
            color: #0f172a;
            font-weight: 700;
            line-height: 1.2;
        }
        .payslip-stat-value.emerald {
            color: #059669;
        }
        .payslip-status-pill {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 0.78rem;
            font-weight: 700;
            padding: 3px 9px;
            border-radius: 20px;
        }
        .payslip-status-pill.paid {
            background: #d1fae5;
            color: #065f46;
        }
        .payslip-status-pill.pending {
            background: #fef3c7;
            color: #92400e;
        }
        .payslip-status-pill.other {
            background: #e0f2fe;
            color: #075985;
        }
        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
            animation: status-pulse 2s infinite;
        }
        @keyframes status-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }
        /* ===== BUTTONS ===== */
        .btn-primary {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 9px 18px;
            border-radius: 8px;
            font-size: 0.83rem;
            font-weight: 600;
            text-decoration: none;
            border: none;
            cursor: pointer;
            background: #4f46e5;
            color: #ffffff;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(79,70,229,0.2);
        }
        .btn-primary:hover {
            background: #4338ca;
            box-shadow: 0 4px 10px rgba(79,70,229,0.25);
            transform: translateY(-1px);
        }
        .btn-primary:active { transform: translateY(0); }
        .btn-secondary {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 9px 18px;
            border-radius: 8px;
            font-size: 0.83rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            background: #ffffff;
            color: #374151;
            border: 1px solid #d1d5db;
            transition: all 0.2s ease;
        }
        .btn-secondary:hover {
            background: #f9fafb;
            border-color: #9ca3af;
            transform: translateY(-1px);
        }
        .btn-secondary:active { transform: translateY(0); }
        /* ===== TEAM CARD ===== */
        .team-lead-strip {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 14px 24px;
            background: #fafbff;
            border-bottom: 1px solid #eef0f6;
        }
        .team-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            color: #fff;
            font-weight: 700;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }
        .team-lead-meta {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .team-lead-role-tag {
            font-size: 0.67rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #6366f1;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .team-lead-fullname {
            font-size: 0.95rem;
            font-weight: 700;
            color: #0f172a;
        }
        .team-emp-id {
            font-size: 0.75rem;
            font-weight: 600;
            color: #64748b;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 3px 8px;
        }
        .team-members-toggle {
            width: 100%;
            background: transparent;
            border: none;
            border-top: 1px solid #f1f5f9;
            padding: 13px 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: background 0.2s ease;
        }
        .team-members-toggle:hover {
            background: #fafbfd;
        }
        .toggle-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.88rem;
            font-weight: 600;
            color: #374151;
        }
        .members-badge {
            background: #e0e7ff;
            color: #4338ca;
            font-size: 0.72rem;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 12px;
        }
        .chevron-icon {
            color: #9ca3af;
            font-size: 0.8rem;
            transition: transform 0.25s ease;
        }
        .chevron-icon.open {
            transform: rotate(180deg);
        }
        /* ===== MEMBER DIRECTORY ===== */
        .member-list {
            border-top: 1px solid #f1f5f9;
        }
        .member-item {
            border-bottom: 1px solid #f8fafc;
            overflow: hidden;
        }
        .member-item:last-child {
            border-bottom: none;
        }
        .member-item-header {
            width: 100%;
            background: transparent;
            border: none;
            padding: 11px 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: background 0.2s ease;
            text-align: left;
        }
        .member-item-header:hover {
            background: #fafbfd;
        }
        .member-summary {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .member-small-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            color: #fff;
            font-weight: 700;
            font-size: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .member-item-name {
            font-size: 0.875rem;
            font-weight: 600;
            color: #1e293b;
        }
        .member-expand-chevron {
            color: #cbd5e1;
            font-size: 0.72rem;
            transition: transform 0.2s ease;
        }
        .member-expand-chevron.open {
            transform: rotate(90deg);
            color: #6366f1;
        }
        .member-item-details {
            background: #fafbff;
            border-top: 1px solid #f1f5f9;
            padding: 12px 24px 12px 66px;
            display: flex;
            flex-direction: column;
            gap: 7px;
            animation: slide-in 0.2s ease;
        }
        @keyframes slide-in {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .member-detail-row {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.82rem;
            color: #475569;
        }
        .member-detail-row i {
            width: 14px;
            color: #a5b4fc;
            font-size: 0.8rem;
        }
        .member-detail-row a {
            color: #4f46e5;
            text-decoration: none;
            font-weight: 500;
        }
        .member-detail-row a:hover {
            text-decoration: underline;
        }
        /* ===== TABLE ===== */
        .table-wrap {
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px 14px;
            border-bottom: 1px solid #f1f5f9;
            text-align: left;
            font-size: 13px;
        }
        th {
            background: #f8fafc;
            color: #64748b;
            font-weight: 700;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }
        tbody tr {
            transition: background 0.15s ease;
        }
        tbody tr:hover {
            background: #fafbff;
        }
        .btn {
            display: inline-block;
            background: #2563eb;
            color: #fff;
            padding: 8px 16px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: var(--transition-base);
        }
        .btn:hover { opacity: 0.9; }
        /* ===== LAYOUT ===== */
        .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        @media (max-width: 1024px) {
            .dashboard-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* HERO GREETING BANNER */}
      <section className="dashboard-hero">
        <div className="hero-left">
          <span className="greeting-prefix">{greeting}</span>
          <h1 className="welcome-title">
            Welcome back, {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username} 
            <span className="hero-role-badge">{user?.role}</span> 
            <span className="wave-emoji">👋</span>
          </h1>
          <p className="hero-subtext">
            You have <span className="hero-task-highlight">{dashboardData?.active_tasks_count || 0}</span> active tasks assigned to you today.
          </p>
        </div>
        <div className="hero-date-widget">
          <div className="hero-date-item">
            <i className="fa-regular fa-calendar-days"></i>
            <span>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="hero-date-divider"></div>
          <div className="hero-date-item">
            <i className="fa-regular fa-clock"></i>
            <span className="hero-time-val">{liveTime || 'Loading...'}</span>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        {/* Latest Payslip Card */}
        <div className="card" style={{ height: 'fit-content' }}>
          {/* Card Header */}
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-title-icon blue">
                <i className="fa-solid fa-file-invoice-dollar"></i>
              </span>
              Latest Payslip
            </h3>
            <Link to="/payslips" className="card-link">
              View All <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.7rem' }}></i>
            </Link>
          </div>

          {dashboardData?.latest_payslip ? (
            <div className="card-body">
              {/* Clean 3-column stat row */}
              <div className="payslip-stats-row">
                <div className="payslip-stat-cell">
                  <span className="payslip-stat-label">Period</span>
                  <span className="payslip-stat-value">
                    {dashboardData.latest_payslip.month_name} {dashboardData.latest_payslip.year}
                  </span>
                </div>
                <div className="payslip-stat-cell">
                  <span className="payslip-stat-label">Net Salary</span>
                  <span className="payslip-stat-value emerald">₹{dashboardData.latest_payslip.net_salary}</span>
                </div>
                <div className="payslip-stat-cell">
                  <span className="payslip-stat-label">Status</span>
                  <span className={`payslip-status-pill ${
                    dashboardData.latest_payslip.status === 'Paid' ? 'paid'
                    : dashboardData.latest_payslip.status === 'Pending Approval' ? 'pending'
                    : 'other'
                  }`}>
                    <span className="status-dot"></span>
                    {dashboardData.latest_payslip.status}
                  </span>
                </div>
              </div>

              {/* Action buttons — primary + secondary hierarchy */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link to={`/payslips/${dashboardData.latest_payslip.id}`} className="btn-primary">
                  <i className="fa-solid fa-eye"></i> View Slip
                </Link>
                {dashboardData.latest_payslip.payslip_pdf && (
                  <a
                    href={`http://127.0.0.1:8000${dashboardData.latest_payslip.payslip_pdf}`}
                    download
                    className="btn-secondary"
                  >
                    <i className="fa-solid fa-download"></i> Download PDF
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="card-body">
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>No payslips published yet.</p>
            </div>
          )}
        </div>

        {/* Team Alignment Card */}
        <div className="card" style={{ height: 'fit-content' }}>
          {/* Card Header */}
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-title-icon indigo">
                <i className="fa-solid fa-people-group"></i>
              </span>
              Team Alignment
            </h3>
          </div>

          {/* Team Lead Strip */}
          {dashboardData?.team_lead ? (
            <div className="team-lead-strip">
              <div
                className="team-avatar"
                style={{ background: getAvatarGradient(dashboardData.team_lead.name) }}
              >
                {getInitials(dashboardData.team_lead.name)}
              </div>
              <div className="team-lead-meta">
                <span className="team-lead-role-tag">
                  <i className="fa-solid fa-star" style={{ color: '#f59e0b', fontSize: '0.6rem' }}></i>
                  Team Lead
                </span>
                <span className="team-lead-fullname">{dashboardData.team_lead.name}</span>
              </div>
              <span className="team-emp-id">{dashboardData.team_lead.emp_id}</span>
            </div>
          ) : (
            <div className="team-lead-strip" style={{ justifyContent: 'center', color: '#94a3b8' }}>
              <i className="fa-solid fa-user-slash" style={{ marginRight: '8px' }}></i>
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>No Team Assigned</span>
            </div>
          )}

          {/* Team Members accordion */}
          {dashboardData?.team_members && dashboardData.team_members.length > 0 ? (
            <>
              <button
                className="team-members-toggle"
                onClick={() => setTeamAccordionOpen(!teamAccordionOpen)}
              >
                <span className="toggle-label">
                  <i className="fa-solid fa-users" style={{ color: '#a5b4fc', fontSize: '0.85rem' }}></i>
                  Team Members
                  <span className="members-badge">{dashboardData.team_members.length}</span>
                </span>
                <i className={`fa-solid fa-chevron-down chevron-icon ${teamAccordionOpen ? 'open' : ''}`}></i>
              </button>

              {teamAccordionOpen && (
                <div className="member-list">
                  {dashboardData.team_members.map((member) => {
                    const isExpanded = !!openMemberAccordion[member.id];
                    return (
                      <div className="member-item" key={member.id}>
                        <button
                          className="member-item-header"
                          onClick={() => toggleMemberAccordion(member.id)}
                        >
                          <div className="member-summary">
                            <div
                              className="member-small-avatar"
                              style={{ background: getAvatarGradient(member.name) }}
                            >
                              {getInitials(member.name)}
                            </div>
                            <span className="member-item-name">{member.name}</span>
                          </div>
                          <i className={`fa-solid fa-chevron-right member-expand-chevron ${isExpanded ? 'open' : ''}`}></i>
                        </button>

                        {isExpanded && (
                          <div className="member-item-details">
                            <div className="member-detail-row">
                              <i className="fa-solid fa-id-badge"></i>
                              <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ID</span>
                              <span style={{ fontWeight: 600, color: '#374151' }}>{member.emp_id || 'N/A'}</span>
                            </div>
                            <div className="member-detail-row">
                              <i className="fa-solid fa-envelope"></i>
                              <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</span>
                              <a href={`mailto:${member.email}`}>{member.email || 'N/A'}</a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '0.88rem' }}>
              No other team members assigned.
            </div>
          )}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '15px' }}>
          <h3><i className="fa-solid fa-list-check" style={{ color: 'var(--accent-blue)', marginRight: '8px' }}></i>Your Tasks (Latest)</h3>
          <Link to="/tasks" style={{ fontSize: '0.88rem', color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>View All Tasks</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData?.tasks && dashboardData.tasks.length > 0 ? (
                dashboardData.tasks.slice(0, 4).map((task) => (
                  <tr key={task.id}>
                    <td style={{ fontWeight: '600' }}>{task.task_name}</td>
                    <td>{task.project?.project_name || 'General'}</td>
                    <td>{task.start_date}</td>
                    <td>{task.end_date}</td>
                    <td>
                      <span className={`badge-capsule ${task.status === 'Completed' ? 'success' : task.status === 'Submitted' ? 'info' : 'warning'}`}>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>No tasks assigned</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
