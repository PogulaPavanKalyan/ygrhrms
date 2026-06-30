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
            background: linear-gradient(135deg, #092a49 0%, #0f172a 100%);
            border-radius: 20px;
            padding: 30px 40px;
            color: #ffffff;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            margin-bottom: 35px;
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.06);
            min-height: 140px;
        }
        .dashboard-hero::before {
            content: '';
            position: absolute;
            top: -60px;
            right: -60px;
            width: 220px;
            height: 220px;
            background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0) 70%);
            border-radius: 50%;
            pointer-events: none;
            filter: blur(15px);
        }
        .dashboard-hero::after {
            content: '';
            position: absolute;
            bottom: -80px;
            left: -80px;
            width: 250px;
            height: 250px;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 70%);
            border-radius: 50%;
            pointer-events: none;
            filter: blur(15px);
        }
        .hero-left {
            position: relative;
            z-index: 2;
            text-align: left;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
        .greeting-prefix {
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #38bdf8;
            margin-bottom: 8px;
            display: block;
        }
        .welcome-title {
            font-size: 1.85rem;
            font-weight: 700;
            letter-spacing: -0.5px;
            line-height: 1.2;
            display: inline-flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            margin: 0 0 8px 0;
            text-align: left;
            justify-content: flex-start;
            color: #ffffff;
        }
        .role-badge {
            display: inline-flex;
            background: rgba(56, 189, 248, 0.12);
            border: 1px solid rgba(56, 189, 248, 0.25);
            color: #38bdf8;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            margin-left: 8px;
            vertical-align: middle;
        }
        .hero-subtext {
            font-size: 0.95rem;
            color: #e2e8f0;
            margin: 0;
            font-weight: 400;
            max-width: 700px;
            line-height: 1.5;
            text-align: left;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            justify-content: flex-start;
            opacity: 0.9;
        }
        .count-pill {
            background: rgba(56, 189, 248, 0.15) !important;
            border: 1px solid rgba(56, 189, 248, 0.3) !important;
            color: #38bdf8 !important;
            padding: 2px 10px !important;
            border-radius: 6px !important;
            font-weight: 700 !important;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin: 0 6px !important;
            font-size: 0.88rem !important;
            min-width: 24px;
            height: 22px;
            vertical-align: middle;
        }
        .banner-date {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 10px;
            white-space: nowrap;
        }
        .date-day {
            background: rgba(255, 255, 255, 0.05) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            padding: 8px 16px !important;
            border-radius: 10px !important;
            color: #f1f5f9 !important;
            font-size: 0.85rem !important;
            font-weight: 600 !important;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            backdrop-filter: blur(4px);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }
        .date-time {
            background: rgba(56, 189, 248, 0.1) !important;
            border: 1px solid rgba(56, 189, 248, 0.2) !important;
            padding: 8px 16px !important;
            border-radius: 10px !important;
            color: #38bdf8 !important;
            font-size: 0.85rem !important;
            font-weight: 700 !important;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(4px);
            box-shadow: 0 4px 12px rgba(56, 189, 248, 0.08);
        }

        /* ===== ACCORDION & CARDS ===== */
        .card {
            background: #fff;
            padding: 24px;
            margin-bottom: 24px;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
            border: 1px solid var(--border);
            text-align: left;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card:hover {
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
        }
        .card h3 {
            font-family: var(--font-display);
            color: var(--primary-color);
            margin-bottom: 16px;
            font-size: 1.1rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .payslip-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
        }
        .payslip-stat-box {
            background: #ffffff;
            padding: 16px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.01);
        }
        .payslip-stat-box:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0,0,0,0.05);
            border-color: #cbd5e1;
        }
        .payslip-stat-icon {
            width: 42px;
            height: 42px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
        }
        .payslip-stat-icon.period {
            background: rgba(59, 130, 246, 0.08);
            color: #3b82f6;
        }
        .payslip-stat-icon.salary {
            background: rgba(16, 185, 129, 0.08);
            color: #10b981;
        }
        .payslip-stat-icon.status {
            background: rgba(16, 185, 129, 0.08);
            color: #10b981;
        }
        .payslip-stat-icon.status.pending {
            background: rgba(245, 158, 11, 0.08);
            color: #f59e0b;
        }
        .payslip-stat-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .payslip-stat-label {
            font-size: 0.7rem;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 700;
        }
        .payslip-stat-value {
            font-size: 1.05rem;
            color: #0f172a;
            font-weight: 700;
        }
        .pulsing-dot {
            width: 8px;
            height: 8px;
            background-color: currentColor;
            border-radius: 50%;
            display: inline-block;
            margin-right: 6px;
            animation: pulse-dot 1.8s infinite ease-in-out;
        }
        @keyframes pulse-dot {
            0% { opacity: 0.4; transform: scale(0.85); }
            50% { opacity: 1; transform: scale(1.15); }
            100% { opacity: 0.4; transform: scale(0.85); }
        }
        .btn-premium {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 20px;
            border-radius: 30px;
            font-size: 0.85rem;
            font-weight: 700;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
        }
        .btn-premium-blue {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        }
        .btn-premium-blue:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15);
        }
        .btn-premium-blue:active {
            transform: translateY(0);
        }
        .btn-premium-emerald {
            background: linear-gradient(135deg, #10b981 0%, #047857 100%);
        }
        .btn-premium-emerald:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.15);
        }
        .btn-premium-emerald:active {
            transform: translateY(0);
        }
        
        .team-lead-card {
            background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 16px 20px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 20px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.01);
        }
        .team-lead-card:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.04);
            border-color: #cbd5e1;
        }
        .team-lead-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
            color: white;
            font-weight: 700;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
        }
        .team-lead-info {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .team-lead-label {
            font-size: 0.68rem;
            font-weight: 700;
            color: #6366f1;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        .team-lead-name {
            font-size: 1.05rem;
            font-weight: 700;
            color: #0f172a;
        }
        .team-lead-badge {
            background: rgba(99, 102, 241, 0.08);
            color: #4f46e5;
            border: 1px solid rgba(99, 102, 241, 0.15);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            align-self: flex-start;
        }
        .accordion-trigger {
            width: 100%;
            background: #ffffff;
            color: #1e293b;
            border: 1px solid #e2e8f0;
            padding: 14px 20px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 0.95rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 700;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.01);
        }
        .accordion-trigger:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.03);
        }
        .accordion-members-count {
            background: rgba(59, 130, 246, 0.1);
            color: #2563eb;
            padding: 2px 10px;
            border-radius: 20px;
            font-size: 0.78rem;
            font-weight: 700;
            margin-left: 8px;
        }
        .accordion-content {
            margin-top: 14px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .member-row {
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            background: #ffffff;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .member-row:hover {
            border-color: #cbd5e1;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
            transform: translateX(2px);
        }
        .member-row-header {
            width: 100%;
            background: transparent;
            border: none;
            padding: 12px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: background 0.2s ease;
        }
        .member-row-header:hover {
            background: #f8fafc;
        }
        .member-profile-summary {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .member-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            color: white;
            font-weight: 700;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .member-name {
            font-weight: 600;
            font-size: 0.92rem;
            color: #1e293b;
        }
        .member-expand-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #f1f5f9;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            transition: all 0.2s ease;
        }
        .member-row-header:hover .member-expand-icon {
            background: #e2e8f0;
            color: #1e293b;
        }
        .member-row-details {
            background: #f8fafc;
            border-top: 1px solid #f1f5f9;
            padding: 16px 20px;
            font-size: 0.85rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
        }
        .member-detail-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #475569;
        }
        .member-detail-item i {
            color: #3b82f6;
            font-size: 0.9rem;
            width: 16px;
        }
        .member-detail-label {
            font-weight: 600;
            color: #64748b;
            margin-right: 4px;
        }
        .table-wrap {
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px 10px;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
            font-size: 13.5px;
        }
        th {
            background: #f1f5f9;
            color: var(--primary-color);
            font-weight: 700;
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
        .btn:hover {
            opacity: 0.9;
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        @media (max-width: 1024px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
        }
      `}</style>

      {/* HERO GREETING BANNER */}
      <section className="dashboard-hero">
        <div className="hero-left">
          <span className="greeting-prefix">{greeting}</span>
          <h1 className="welcome-title">
            Welcome back, {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username} <span className="role-badge">{user?.role}</span> 👋
          </h1>
          <p className="hero-subtext">
            You have <span className="count-pill">{dashboardData?.active_tasks_count || 0}</span> active tasks assigned to you today.
          </p>
        </div>
        <div className="banner-date">
          <span className="date-day">
            <i className="fa-regular fa-calendar" aria-hidden="true"></i> {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span className="date-time">{liveTime || 'Loading...'}</span>
        </div>
      </section>

      <div className="dashboard-grid">
        {/* Latest Payslip Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-file-invoice-dollar" style={{ color: '#3b82f6' }}></i>
              Latest Payslip
            </h3>
            <Link to="/payslips" style={{ fontSize: '0.88rem', color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>View All Payslips</Link>
          </div>

          {dashboardData?.latest_payslip ? (
            <div>
              <div className="payslip-stats-grid">
                {/* Period */}
                <div className="payslip-stat-box">
                  <div className="payslip-stat-icon period">
                    <i className="fa-regular fa-calendar-days"></i>
                  </div>
                  <div className="payslip-stat-info">
                    <span className="payslip-stat-label">Period</span>
                    <div className="payslip-stat-value">{dashboardData.latest_payslip.month_name} {dashboardData.latest_payslip.year}</div>
                  </div>
                </div>

                {/* Net Salary */}
                <div className="payslip-stat-box">
                  <div className="payslip-stat-icon salary">
                    <i className="fa-solid fa-wallet"></i>
                  </div>
                  <div className="payslip-stat-info">
                    <span className="payslip-stat-label">Net Salary</span>
                    <div className="payslip-stat-value" style={{ color: '#10b981' }}>₹{dashboardData.latest_payslip.net_salary}</div>
                  </div>
                </div>

                {/* Status */}
                <div className="payslip-stat-box">
                  <div className={`payslip-stat-icon status ${dashboardData.latest_payslip.status !== 'Paid' ? 'pending' : ''}`}>
                    <i className={dashboardData.latest_payslip.status === 'Paid' ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation"}></i>
                  </div>
                  <div className="payslip-stat-info">
                    <span className="payslip-stat-label">Status</span>
                    <div className="payslip-stat-value">
                      <span className={`badge-capsule ${dashboardData.latest_payslip.status === 'Paid' ? 'success' : dashboardData.latest_payslip.status === 'Pending Approval' ? 'warning' : 'info'}`} style={{ fontSize: '0.8rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center' }}>
                        <span className="pulsing-dot"></span>
                        {dashboardData.latest_payslip.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Link to={`/payslips/${dashboardData.latest_payslip.id}`} className="btn-premium btn-premium-blue">
                  <i className="fa-solid fa-eye"></i> View Slip
                </Link>
                {dashboardData.latest_payslip.payslip_pdf && (
                  <a href={`http://127.0.0.1:8000${dashboardData.latest_payslip.payslip_pdf}`} download className="btn-premium btn-premium-emerald">
                    <i className="fa-solid fa-download"></i> Download PDF
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p style={{ color: '#64748b', margin: 0 }}>No payslips published yet.</p>
          )}
        </div>

        {/* Team Section */}
        <div className="card">
          <h3>👥 Team Alignment</h3>
          {dashboardData?.team_lead ? (
            <div className="team-lead-card">
              <div className="team-lead-avatar" style={{ background: getAvatarGradient(dashboardData.team_lead.name) }}>
                {getInitials(dashboardData.team_lead.name)}
              </div>
              <div className="team-lead-info">
                <span className="team-lead-label">
                  <i className="fa-solid fa-star" style={{ color: '#eab308' }}></i> Team Lead
                </span>
                <span className="team-lead-name">{dashboardData.team_lead.name}</span>
              </div>
              <span className="team-lead-badge">{dashboardData.team_lead.emp_id}</span>
            </div>
          ) : (
            <div className="team-lead-card" style={{ background: '#f8fafc', justifyContent: 'center', color: '#64748b' }}>
              <i className="fa-solid fa-user-slash" style={{ marginRight: '8px' }}></i> No Team Assigned
            </div>
          )}

          {dashboardData?.team_members && dashboardData.team_members.length > 0 ? (
            <div>
              <button className="accordion-trigger" onClick={() => setTeamAccordionOpen(!teamAccordionOpen)}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  👥 Team Members 
                  <span className="accordion-members-count">{dashboardData.team_members.length}</span>
                </span>
                <i className="fa-solid fa-chevron-down" style={{ transform: teamAccordionOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}></i>
              </button>

              {teamAccordionOpen && (
                <div className="accordion-content">
                  {dashboardData.team_members.map((member) => {
                    const isExpanded = !!openMemberAccordion[member.id];
                    return (
                      <div className="member-row" key={member.id}>
                        <button className="member-row-header" onClick={() => toggleMemberAccordion(member.id)}>
                          <div className="member-profile-summary">
                            <div className="member-avatar" style={{ background: getAvatarGradient(member.name) }}>
                              {getInitials(member.name)}
                            </div>
                            <span className="member-name">{member.name}</span>
                          </div>
                          <div className="member-expand-icon" style={{ transform: isExpanded ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>
                            <i className="fa-solid fa-plus"></i>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="member-row-details">
                            <div className="member-detail-item">
                              <i className="fa-solid fa-id-card"></i>
                              <span className="member-detail-label">Employee ID:</span>
                              <span>{member.emp_id || 'N/A'}</span>
                            </div>
                            <div className="member-detail-item">
                              <i className="fa-solid fa-envelope"></i>
                              <span className="member-detail-label">Email:</span>
                              <a href={`mailto:${member.email}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{member.email || 'N/A'}</a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#64748b', margin: 0 }}>No other team members assigned.</p>
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
