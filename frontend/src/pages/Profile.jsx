import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const attBarRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const isEditRoute = location.pathname === '/profile/edit';
  
  const [showEditModal, setShowEditModal] = useState(false);
  const showEdit = showEditModal || isEditRoute;

  // Form states
  const [editFirstName, setEditFirstName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editPic, setEditPic] = useState(null);
  const [removePic, setRemovePic] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Initialize form when profileData loads
  useEffect(() => {
    if (profileData && profileData.user) {
      const u = profileData.user;
      setEditFirstName(u.first_name || '');
      setEditEmail(u.email || '');
      setEditPhone(u.phone || '');
      setEditAddress(u.address || '');
      setEditDob(u.date_of_birth || '');
      setEditGender(u.gender || 'Male');
    }
  }, [profileData]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('first_name', editFirstName);
      formData.append('email', editEmail);
      formData.append('phone', editPhone);
      formData.append('address', editAddress);
      formData.append('date_of_birth', editDob);
      formData.append('gender', editGender);
      if (editPic) {
        formData.append('profile_pic', editPic);
      }
      if (removePic) {
        formData.append('remove_profile_pic', 'true');
      }

      await api.put('/api/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Profile updated successfully!');
      setShowEditModal(false);
      if (isEditRoute) {
        navigate('/profile');
      }
      fetchProfile(selectedMonth);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  const fetchProfile = async (month) => {
    setLoading(true);
    try {
      const params = month ? { month } : {};
      const res = await api.get('/api/profile/', { params });
      
      // Log the complete API response
      console.log('Profile API Complete Response:', {
        url: '/api/profile/',
        method: 'GET',
        headers: res.config?.headers || {},
        status: res.status,
        payload: res.data
      });

      setProfileData(res.data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile(selectedMonth);
  }, []);

  useEffect(() => {
    if (profileData && attBarRef.current) {
      setTimeout(() => {
        if (attBarRef.current) {
          attBarRef.current.style.width = `${profileData.attendance?.percentage || 0}%`;
        }
      }, 300);
    }
  }, [profileData]);

  const handleMonthFilter = (e) => {
    e.preventDefault();
    fetchProfile(selectedMonth);
  };

  const computeTenure = (dateOfJoining) => {
    if (!dateOfJoining || dateOfJoining === 'None') return '—';
    const joining = new Date(dateOfJoining);
    const now = new Date();
    const diffMs = now - joining;
    const years = (diffMs / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
    return isNaN(years) ? '—' : years;
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getProjectBadgeClass = (status) => {
    if (status === 'Completed') return 'completed';
    if (status === 'In Progress') return 'inprogress';
    return 'pending';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32, color: '#3b82f6' }}></i>
      </div>
    );
  }

  const { user, attendance, leave_summary, projects, salary_structure } = profileData || {};

  // ── Profile photo: use absolute URL from backend (profile_pic_url),
  //    or fall back to prefixing the relative path with the API base URL.
  const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
  const avatarUrl = user?.profile_pic_url
    || (user?.profile_pic ? (user.profile_pic.startsWith('http') ? user.profile_pic : `${API_BASE}${user.profile_pic}`) : null);

  // ── Full name ──
  const fullName = (user?.first_name && (user.first_name + ' ' + (user.last_name || '')).trim())
    || user?.username || '—';

  // ── Department: show human-readable label ──
  const departmentLabel = user?.department_display || user?.department || '—';

  const getInitials = () => {
    const first = user?.first_name || '';
    const last = user?.last_name || '';
    if (first || last) {
      return ((first[0] || '') + (last[0] || '')).toUpperCase();
    }
    return (user?.username?.[0] || '?').toUpperCase();
  };

  return (
    <div className="profile-page">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        .profile-page {
          font-family: 'Inter', sans-serif;
          background: #f1f5f9;
          min-height: 100vh;
          padding: 0 0 60px;
        }

        .profile-hero {
          background: linear-gradient(135deg, #0d2f5c 0%, #1a4a8a 45%, #2563eb 100%);
          padding: 40px 32px 100px;
          position: relative;
          overflow: hidden;
        }
        .profile-hero::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
        }
        .profile-hero::after {
          content: '';
          position: absolute;
          bottom: -40px; left: 20%;
          width: 180px; height: 180px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }

        .hero-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0;
          position: relative; z-index: 2;
        }

        .hero-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255,255,255,0.65);
        }
        .hero-breadcrumb span { color: rgba(255,255,255,0.4); }
        .hero-breadcrumb strong { color: rgba(255,255,255,0.9); }

        .btn-edit-profile {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.15);
          color: #fff;
          border: 1.5px solid rgba(255,255,255,0.3);
          border-radius: 10px;
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.22s ease, border-color 0.22s ease;
          backdrop-filter: blur(8px);
          cursor: pointer;
        }
        .btn-edit-profile:hover {
          background: rgba(255,255,255,0.25);
          border-color: rgba(255,255,255,0.5);
          color: #fff;
        }

        .profile-identity-card {
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          padding: 24px 28px;
          margin: -70px 24px 0;
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .identity-avatar { position: relative; flex-shrink: 0; }
        .identity-avatar img {
          width: 100px; height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #dbeafe;
          box-shadow: 0 4px 16px rgba(59,130,246,0.3);
        }
        .identity-avatar-initials {
          width: 100px; height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0d2f5c, #3b82f6);
          display: flex; align-items: center; justify-content: center;
          font-size: 36px; font-weight: 800; color: #fff;
          border: 4px solid #dbeafe;
          box-shadow: 0 4px 16px rgba(59,130,246,0.3);
        }
        .online-badge {
          position: absolute;
          bottom: 5px; right: 5px;
          width: 16px; height: 16px;
          background: #10b981;
          border: 3px solid #fff;
          border-radius: 50%;
        }

        .identity-info { flex: 1; min-width: 200px; }
        .identity-name { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
        .identity-designation { font-size: 13px; font-weight: 600; color: #3b82f6; margin-bottom: 8px; }

        .identity-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .id-tag {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 600;
          padding: 4px 12px; border-radius: 20px;
        }
        .id-tag.dept   { background: #eff6ff; color: #3b82f6; }
        .id-tag.status { background: #dcfce7; color: #065f46; }
        .id-tag.role   { background: #f5f3ff; color: #8b5cf6; }
        .id-tag.emp-id { background: #f1f5f9; color: #475569; }

        .identity-stats { display: flex; gap: 24px; margin-left: auto; flex-shrink: 0; }
        .istat { text-align: center; }
        .istat-val { font-size: 22px; font-weight: 800; color: #0d2f5c; line-height: 1; }
        .istat-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
        .istat-divider { width: 1px; background: #e2e8f0; align-self: stretch; }

        .profile-body {
          padding: 28px 24px 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .info-card {
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.07);
          overflow: hidden;
          transition: box-shadow 0.22s ease, transform 0.22s ease;
        }
        .info-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.12); transform: translateY(-2px); }
        .info-card.full-width { grid-column: 1 / -1; }

        .card-header {
          display: flex; align-items: center; gap: 10px;
          padding: 18px 24px;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(to right, #fafcff, #f0f7ff);
        }
        .card-header-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0;
        }
        .icon-blue   { background: #eff6ff; color: #3b82f6; }
        .icon-green  { background: #dcfce7; color: #10b981; }
        .icon-orange { background: #fef3c7; color: #f59e0b; }
        .icon-purple { background: #f5f3ff; color: #8b5cf6; }
        .icon-red    { background: #fee2e2; color: #ef4444; }
        .icon-brand  { background: #e8edf5; color: #0d2f5c; }

        .card-header-title { font-size: 14px; font-weight: 700; color: #0f172a; }
        .card-header-sub { font-size: 11px; color: #94a3b8; font-weight: 500; }

        .card-body { padding: 20px 24px; }

        .info-row {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 12px; padding: 11px 0; border-bottom: 1px solid #f1f5f9;
        }
        .info-row:last-child { border-bottom: none; padding-bottom: 0; }
        .info-row:first-child { padding-top: 0; }

        .info-label {
          font-size: 12px; font-weight: 600; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.04em;
          flex-shrink: 0; min-width: 110px;
        }
        .info-value {
          font-size: 13px; font-weight: 600; color: #0f172a;
          text-align: right; word-break: break-word;
        }
        .info-value.muted { color: #94a3b8; font-weight: 500; }

        .attendance-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
        }
        .att-stat {
          text-align: center; padding: 16px 10px; border-radius: 12px;
          transition: transform 0.22s ease;
        }
        .att-stat:hover { transform: scale(1.04); }
        .att-stat.blue   { background: #eff6ff; }
        .att-stat.green  { background: #dcfce7; }
        .att-stat.red    { background: #fee2e2; }
        .att-stat.orange { background: #fef3c7; }
        .att-stat-val { font-size: 26px; font-weight: 800; line-height: 1; margin-bottom: 5px; }
        .att-stat.blue   .att-stat-val { color: #3b82f6; }
        .att-stat.green  .att-stat-val { color: #10b981; }
        .att-stat.red    .att-stat-val { color: #ef4444; }
        .att-stat.orange .att-stat-val { color: #f59e0b; }
        .att-stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; }

        .att-bar-wrapper { margin-top: 18px; }
        .att-bar-labels { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 6px; }
        .att-bar-track { height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
        .att-bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #10b981, #34d399); transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); width: 0%; }

        .leave-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .leave-stat {
          text-align: center; padding: 16px 8px; border-radius: 12px;
          border: 1.5px solid transparent;
          transition: transform 0.22s ease, border-color 0.22s ease;
        }
        .leave-stat:hover { transform: scale(1.04); border-color: currentColor; }
        .leave-stat.approved { background: #dcfce7; color: #065f46; }
        .leave-stat.pending  { background: #fef3c7; color: #92400e; }
        .leave-stat.rejected { background: #fee2e2; color: #991b1b; }
        .leave-stat-val { font-size: 28px; font-weight: 800; line-height: 1; }
        .leave-stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 5px; }

        .project-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 0; border-bottom: 1px solid #f1f5f9; gap: 12px;
        }
        .project-item:last-child { border-bottom: none; padding-bottom: 0; }
        .project-item:first-child { padding-top: 0; }
        .project-name { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
        .project-team { font-size: 11px; color: #94a3b8; font-weight: 500; }
        .proj-badge { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; white-space: nowrap; }
        .proj-badge.completed  { background: #dcfce7; color: #065f46; }
        .proj-badge.inprogress { background: #fef3c7; color: #92400e; }
        .proj-badge.pending    { background: #f1f5f9; color: #475569; }

        .quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 8px 0; }
        .qa-btn {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 18px 10px; border-radius: 12px; border: 1.5px solid #e2e8f0;
          text-decoration: none;
          transition: background 0.22s ease, border-color 0.22s ease, transform 0.15s;
          cursor: pointer; background: #fff;
        }
        .qa-btn:hover { background: #eff6ff; border-color: #3b82f6; transform: translateY(-2px); }
        .qa-btn i { font-size: 20px; color: #3b82f6; }
        .qa-btn span { font-size: 11px; font-weight: 700; color: #475569; text-align: center; line-height: 1.3; }

        .secure-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 700; background: #f1f5f9; color: #94a3b8;
          padding: 2px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.06em;
        }

        .empty-state { text-align: center; padding: 30px 20px; color: #94a3b8; }
        .empty-state i { font-size: 36px; margin-bottom: 10px; display: block; opacity: 0.4; }
        .empty-state p { font-size: 13px; font-weight: 500; }

        @media (max-width: 900px) {
          .profile-body { grid-template-columns: 1fr; }
          .info-card.full-width { grid-column: 1; }
          .identity-stats { display: none; }
          .attendance-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .profile-identity-card { flex-direction: column; margin: -70px 12px 0; }
          .profile-hero { padding-bottom: 110px; }
          .leave-grid { grid-template-columns: repeat(2, 1fr); }
          .quick-actions { grid-template-columns: repeat(2, 1fr); }
          .profile-body { padding: 16px 12px 0; }
          .hero-top { flex-direction: column; align-items: flex-start; gap: 12px; }
          .attendance-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      {/* ═══ HERO BANNER ═══ */}
      <div className="profile-hero">
        <div className="hero-top">
          <div className="hero-breadcrumb">
            <i className="fa-solid fa-house" style={{ color: 'rgba(255,255,255,0.5)' }}></i>
            <span>›</span>
            <strong>My Profile</strong>
          </div>
          <button onClick={() => setShowEditModal(true)} className="btn-edit-profile">
            <i className="fa-solid fa-pen-to-square"></i> Edit Profile
          </button>
        </div>
      </div>

      {/* ═══ IDENTITY CARD ═══ */}
      <div className="profile-identity-card">
        <div className="identity-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} />
          ) : (
            <div className="identity-avatar-initials">
              {getInitials()}
            </div>
          )}
          <div className="online-badge" title="Online"></div>
        </div>

        <div className="identity-info">
          <div className="identity-name">{fullName}</div>
          <div className="identity-designation">{user?.designation || '—'}</div>
          <div className="identity-tags">
            <span className="id-tag emp-id"><i className="fa-solid fa-hashtag"></i> {user?.emp_id || '—'}</span>
            <span className="id-tag dept"><i className="fa-solid fa-building"></i> {departmentLabel}</span>
            <span className="id-tag role"><i className="fa-solid fa-user-shield"></i> {user?.role}</span>
            <span className="id-tag status"><i className="fa-solid fa-circle-check"></i> Active</span>
          </div>
        </div>

        <div className="identity-stats">
          <div className="istat">
            <div className="istat-val">{computeTenure(user?.date_of_joining)}</div>
            <div className="istat-label">Years</div>
          </div>
          <div className="istat-divider"></div>
          <div className="istat">
            <div className="istat-val">{attendance?.present_days ?? 0}</div>
            <div className="istat-label">Present</div>
          </div>
          <div className="istat-divider"></div>
          <div className="istat">
            <div className="istat-val">{projects?.length ?? 0}</div>
            <div className="istat-label">Projects</div>
          </div>
        </div>
      </div>

      {/* ═══ BODY GRID ═══ */}
      <div className="profile-body">

        {/* ─── Personal Information ─── */}
        <div className="info-card">
          <div className="card-header">
            <div className="card-header-icon icon-blue"><i className="fa-solid fa-user"></i></div>
            <div>
              <div className="card-header-title">Personal Information</div>
              <div className="card-header-sub">Your personal and contact details</div>
            </div>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">Full Name</span>
              <span className="info-value">{fullName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{user?.email || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Phone</span>
              <span className="info-value">{user?.phone || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Gender</span>
              <span className="info-value">{user?.gender || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Date of Birth</span>
              <span className="info-value">{formatDate(user?.date_of_birth)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Address</span>
              <span className="info-value">{user?.address || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Aadhaar</span>
              <span className="info-value">
                {(user?.aadhaar || salary_structure?.has_aadhaar)
                  ? <span className="secure-badge"><i className="fa-solid fa-lock"></i> Secured</span>
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Employment Information ─── */}
        <div className="info-card">
          <div className="card-header">
            <div className="card-header-icon icon-brand"><i className="fa-solid fa-briefcase"></i></div>
            <div>
              <div className="card-header-title">Employment Information</div>
              <div className="card-header-sub">Job role and organisational details</div>
            </div>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">Employee ID</span>
              <span className="info-value">{user?.emp_id || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Employee Code</span>
              <span className="info-value">{user?.emp_id || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Designation</span>
              <span className="info-value">{user?.designation || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Department</span>
              <span className="info-value">{departmentLabel}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Role</span>
              <span className="info-value">{user?.role}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status</span>
              <span className="info-value">{user?.status || 'Active'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Join Date</span>
              <span className="info-value">{formatDate(user?.date_of_joining)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Reports To</span>
              <span className="info-value">{user?.reporting_manager_name || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Team Leader</span>
              <span className="info-value">{user?.team_leader_name || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Experience</span>
              <span className="info-value">
                {user?.experience_years ? `${user.experience_years} yrs` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Payroll & Bank ─── */}
        <div className="info-card">
          <div className="card-header">
            <div className="card-header-icon icon-green"><i className="fa-solid fa-coins"></i></div>
            <div>
              <div className="card-header-title">Payroll &amp; Bank Details</div>
              <div className="card-header-sub">Salary, tax and banking information</div>
            </div>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">Monthly CTC</span>
              <span className="info-value">₹{user?.salary || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">PAN</span>
              <span className="info-value">
                {salary_structure?.has_pan
                  ? <span className="secure-badge"><i className="fa-solid fa-lock"></i> Secured</span>
                  : '—'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">UAN</span>
              <span className="info-value">
                {salary_structure?.has_uan
                  ? <span className="secure-badge"><i className="fa-solid fa-lock"></i> Secured</span>
                  : '—'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Bank Name</span>
              <span className="info-value">{salary_structure?.bank_name || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Account No.</span>
              <span className="info-value">
                {salary_structure?.has_account_number
                  ? <span className="secure-badge"><i className="fa-solid fa-lock"></i> Secured</span>
                  : '—'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">IFSC Code</span>
              <span className="info-value">{salary_structure?.ifsc_code || '—'}</span>
            </div>
          </div>
        </div>

        {/* ─── Quick Actions ─── */}
        <div className="info-card">
          <div className="card-header">
            <div className="card-header-icon icon-purple"><i className="fa-solid fa-bolt"></i></div>
            <div>
              <div className="card-header-title">Quick Actions</div>
              <div className="card-header-sub">Shortcuts to common tasks</div>
            </div>
          </div>
          <div className="card-body">
            <div className="quick-actions">
              <Link to="/profile/edit" className="qa-btn">
                <i className="fa-solid fa-user-pen"></i>
                <span>Edit Profile</span>
              </Link>
              <Link to="/payslips" className="qa-btn">
                <i className="fa-solid fa-file-invoice-dollar"></i>
                <span>My Payslips</span>
              </Link>
              <Link to="/leave" className="qa-btn">
                <i className="fa-solid fa-calendar-xmark"></i>
                <span>Apply Leave</span>
              </Link>
              <Link to="/attendance" className="qa-btn">
                <i className="fa-solid fa-clock"></i>
                <span>Attendance</span>
              </Link>
              <Link to="/leave" className="qa-btn">
                <i className="fa-solid fa-list-check"></i>
                <span>Leave Status</span>
              </Link>
              <Link to="/messages" className="qa-btn">
                <i className="fa-solid fa-comment-dots"></i>
                <span>Messages</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Attendance Overview (full width) ─── */}
        <div className="info-card full-width">
          <div className="card-header">
            <div className="card-header-icon icon-orange"><i className="fa-solid fa-calendar-days"></i></div>
            <div>
              <div className="card-header-title">Attendance Overview</div>
              <div className="card-header-sub">Current month attendance summary</div>
            </div>
            <form onSubmit={handleMonthFilter} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontFamily: 'inherit', background: '#fff', color: '#0f172a', outline: 'none' }}
              />
              <button type="submit" style={{ background: '#0d2f5c', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Filter
              </button>
            </form>
          </div>
          <div className="card-body">
            <div className="attendance-grid">
              <div className="att-stat blue">
                <div className="att-stat-val">{attendance?.total_days ?? 0}</div>
                <div className="att-stat-label">Total Days</div>
              </div>
              <div className="att-stat green">
                <div className="att-stat-val">{attendance?.present_days ?? 0}</div>
                <div className="att-stat-label">Present</div>
              </div>
              <div className="att-stat red">
                <div className="att-stat-val">{attendance?.absent_days ?? 0}</div>
                <div className="att-stat-label">Absent</div>
              </div>
              <div className="att-stat orange">
                <div className="att-stat-val">{attendance?.percentage ?? 0}%</div>
                <div className="att-stat-label">Attendance</div>
              </div>
            </div>
            <div className="att-bar-wrapper">
              <div className="att-bar-labels">
                <span>Attendance Rate</span>
                <span>{attendance?.percentage ?? 0}%</span>
              </div>
              <div className="att-bar-track">
                <div className="att-bar-fill" ref={attBarRef}></div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Leave Summary ─── */}
        <div className="info-card">
          <div className="card-header">
            <div className="card-header-icon icon-red"><i className="fa-solid fa-umbrella-beach"></i></div>
            <div>
              <div className="card-header-title">Leave Summary</div>
              <div className="card-header-sub">This year's leave record</div>
            </div>
          </div>
          <div className="card-body">
            <div className="leave-grid">
              <div className="leave-stat approved">
                <div className="leave-stat-val">{leave_summary?.approved ?? 0}</div>
                <div className="leave-stat-label">Approved</div>
              </div>
              <div className="leave-stat pending">
                <div className="leave-stat-val">{leave_summary?.pending ?? 0}</div>
                <div className="leave-stat-label">Pending</div>
              </div>
              <div className="leave-stat rejected">
                <div className="leave-stat-val">{leave_summary?.rejected ?? 0}</div>
                <div className="leave-stat-label">Rejected</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Work Background ─── */}
        <div className="info-card">
          <div className="card-header">
            <div className="card-header-icon icon-purple"><i className="fa-solid fa-building-columns"></i></div>
            <div>
              <div className="card-header-title">Work Background</div>
              <div className="card-header-sub">Previous employment details</div>
            </div>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">Prev. Company</span>
              <span className="info-value">{user?.previous_company || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Exp. Years</span>
              <span className="info-value">
                {user?.experience_years ? `${user.experience_years} yrs` : '—'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Emp. Status</span>
              <span className="info-value">{user?.status || 'Fresher'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Team Name</span>
              <span className="info-value">{user?.team_name || '—'}</span>
            </div>
          </div>
        </div>

        {/* ─── Assigned Projects (full width) ─── */}
        <div className="info-card full-width">
          <div className="card-header">
            <div className="card-header-icon icon-brand"><i className="fa-solid fa-diagram-project"></i></div>
            <div>
              <div className="card-header-title">Assigned Projects</div>
              <div className="card-header-sub">Projects you are currently working on</div>
            </div>
          </div>
          <div className="card-body">
            {projects && projects.length > 0 ? (
              projects.map((project, idx) => (
                <div className="project-item" key={idx}>
                  <div>
                    <div className="project-name">{project.name}</div>
                    <div className="project-team">Team Lead: {project.team_lead}</div>
                  </div>
                  <span className={`proj-badge ${getProjectBadgeClass(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <i className="fa-solid fa-folder-open"></i>
                <p>No projects assigned yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>{/* /.profile-body */}
      
      {showEdit && (
        <div className="modal-overlay" onClick={() => { setShowEditModal(false); if (isEditRoute) navigate('/profile'); }}>
          <div className="modal-container" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile Information</h3>
              <button className="modal-close" onClick={() => { setShowEditModal(false); if (isEditRoute) navigate('/profile'); }}>×</button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ textAlign: 'left' }}>
              <div className="form-group">
                <label>First Name</label>
                <input type="text" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea value={editAddress} onChange={(e) => setEditAddress(e.target.value)} rows="3" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}></textarea>
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select value={editGender} onChange={(e) => setEditGender(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Profile Picture</label>
                <input type="file" accept="image/*" onChange={(e) => setEditPic(e.target.files[0])} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={removePic} onChange={(e) => setRemovePic(e.target.checked)} style={{ width: 'auto' }} />
                <label style={{ marginBottom: 0 }}>Remove current profile picture</label>
              </div>
              <button type="submit" className="btn" disabled={updating} style={{ width: '100%', marginTop: '10px' }}>
                {updating ? 'Updating profile...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
