import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const HRDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHRStats = async () => {
      try {
        const res = await api.get('/api/dashboard/hr/');
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching HR dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHRStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: 'var(--muted)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginRight: '10px' }}></i> Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: #ffffff;
          border: 1px solid var(--border);
          border-radius: var(--border-radius);
          padding: 20px;
          box-shadow: var(--card-shadow);
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          color: #ffffff;
        }
        .stat-info {
          text-align: left;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--primary-color);
          line-height: 1.2;
        }
        .stat-label {
          font-size: 0.8rem;
          color: var(--muted);
          font-weight: 600;
          text-transform: uppercase;
          margin-top: 2px;
        }
        .hr-dashboard-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
        }
        @media (max-width: 768px) {
          .hr-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>HR Management Portal</h2>

      {/* Stats Cards Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--accent-blue), #1e40af)' }}>
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats?.total_users || 0}</div>
            <div className="stat-label">Total Staff</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--success), #065f46)' }}>
            <i className="fa-solid fa-user-tie"></i>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats?.manager_count || 0}</div>
            <div className="stat-label">Managers</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--warning), #92400e)' }}>
            <i className="fa-solid fa-user-shield"></i>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats?.teamlead_count || 0}</div>
            <div className="stat-label">Team Leads</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--danger), #991b1b)' }}>
            <i className="fa-solid fa-user"></i>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats?.employee_count || 0}</div>
            <div className="stat-label">Employees</div>
          </div>
        </div>
      </div>

      <div className="hr-dashboard-grid">
        {/* Daily Tasks/Reports overview */}
        <div className="dashboard-panel-card">
          <div className="panel-header">
            <h2><i className="fa-solid fa-file-pen" style={{ color: 'var(--accent-blue)', marginRight: '8px' }}></i> Reports & Submissions</h2>
          </div>
          <div className="panel-body">
            <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>
                Managers and Team Leads submit regular status updates.
              </p>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'inline-block' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)' }}>Submissions Received Today:</span>
                <span style={{ marginLeft: '10px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>
                  {stats?.today_reports_count || 0} reports
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Holiday stats summary */}
        <div className="dashboard-panel-card">
          <div className="panel-header">
            <h2><i className="fa-solid fa-calendar-minus" style={{ color: 'var(--accent-blue)', marginRight: '8px' }}></i> Holiday Registry</h2>
          </div>
          <div className="panel-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', fontSize: '13.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span>Total Holidays Scheduled:</span>
                <strong>{stats?.holiday_stats?.all || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span>Approved Holidays:</span>
                <strong style={{ color: 'var(--success)' }}>{stats?.holiday_stats?.approved || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pending MD Approvals:</span>
                <strong style={{ color: 'var(--warning)' }}>{stats?.holiday_stats?.pending || 0}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
