import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const MDDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMDData = async () => {
      try {
        const res = await api.get('/api/dashboard/md/');
        setData(res.data);
      } catch (err) {
        console.error('Error fetching MD dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMDData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: 'var(--muted)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginRight: '10px' }}></i> Loading executive deck...
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .md-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          margin-bottom: 24px;
        }
        .md-stat-card {
          background: #ffffff;
          border: 1px solid var(--border);
          border-radius: var(--border-radius);
          padding: 16px 20px;
          box-shadow: var(--card-shadow);
          text-align: left;
        }
        .md-stat-label {
          font-size: 0.75rem;
          color: var(--muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .md-stat-value {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--primary-color);
        }
        .md-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .md-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Managing Director Boardroom</h2>

      {/* Stats Row */}
      <div className="md-stats-grid">
        <div className="md-stat-card" style={{ borderLeft: '3px solid var(--primary-color)' }}>
          <div className="md-stat-label">Total Company</div>
          <div className="md-stat-value">{data?.total_cmp || 0} Staff</div>
        </div>
        <div className="md-stat-card" style={{ borderLeft: '3px solid var(--accent-blue)' }}>
          <div className="md-stat-label">Active Projects</div>
          <div className="md-stat-value">{data?.total_project || 0}</div>
        </div>
        <div className="md-stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
          <div className="md-stat-label">HR Admin</div>
          <div className="md-stat-value">{data?.total_hr || 0}</div>
        </div>
        <div className="md-stat-card" style={{ borderLeft: '3px solid var(--warning)' }}>
          <div className="md-stat-label">Managers</div>
          <div className="md-stat-value">{data?.total_mr || 0}</div>
        </div>
        <div className="md-stat-card" style={{ borderLeft: '3px solid #8b5cf6' }}>
          <div className="md-stat-label">Team Leads</div>
          <div className="md-stat-value">{data?.total_tl || 0}</div>
        </div>
        <div className="md-stat-card" style={{ borderLeft: '3px solid var(--danger)' }}>
          <div className="md-stat-label">Developers</div>
          <div className="md-stat-value">{data?.total_emp || 0}</div>
        </div>
      </div>

      <div className="md-grid">
        {/* User Directory */}
        <div className="dashboard-panel-card">
          <div className="panel-header">
            <h2><i className="fa-solid fa-users" style={{ color: 'var(--accent-blue)', marginRight: '8px' }}></i> Active Staff Registry</h2>
          </div>
          <div className="panel-body">
            <div className="table-wrap">
              <table className="dense-table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Full Name</th>
                    <th>Role</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.all_users && data.all_users.length > 0 ? (
                    data.all_users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.emp_id || 'N/A'}</td>
                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                        <td>
                          <span className={`badge-capsule info`}>{u.role}</span>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{u.department?.replace('_', ' ') || 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--muted)' }}>No staff registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Approvals metrics */}
        <div className="dashboard-panel-card">
          <div className="panel-header">
            <h2><i className="fa-solid fa-shield-halved" style={{ color: 'var(--accent-blue)', marginRight: '8px' }}></i> Executive Approvals Pending</h2>
          </div>
          <div className="panel-body" style={{ textAlign: 'left', fontSize: '13.5px', lineHeight: '1.8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px' }}>
              <span>Holiday Approvals Waiting:</span>
              <strong style={{ color: 'var(--warning)' }}>{data?.holiday_stats?.pending || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px' }}>
              <span>Attendance Corrections Waiting:</span>
              <strong style={{ color: 'var(--warning)' }}>{data?.pending_corrections_count || 0}</strong>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '10px' }}>
              * Executive approvals are mandatory for corrections and company-wide holiday calendar adjustments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MDDashboard;
