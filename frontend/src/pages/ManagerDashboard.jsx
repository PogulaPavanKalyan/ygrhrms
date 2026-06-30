import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const res = await api.get('/api/dashboard/manager/');
        setData(res.data);
      } catch (err) {
        console.error('Error fetching Manager dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchManagerData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: 'var(--muted)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginRight: '10px' }}></i> Loading console...
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .m-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }
        .m-stat-card {
          background: #ffffff;
          border: 1px solid var(--border);
          border-radius: var(--border-radius);
          padding: 20px;
          box-shadow: var(--card-shadow);
          display: flex;
          align-items: center;
          gap: 16px;
          text-align: left;
        }
        .m-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          color: #ffffff;
        }
        .m-stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--primary-color);
          line-height: 1.2;
        }
        .m-stat-label {
          font-size: 0.8rem;
          color: var(--muted);
          font-weight: 600;
          text-transform: uppercase;
        }
        .m-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .m-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Manager Console</h2>

      {/* Stats row */}
      <div className="m-stats-grid">
        <div className="m-stat-card">
          <div className="m-stat-icon" style={{ background: 'linear-gradient(135deg, var(--accent-blue), #1e40af)' }}>
            <i className="fa-solid fa-folder-open"></i>
          </div>
          <div>
            <div className="m-stat-value">{(data?.projects_received || 0) + (data?.projects_assigned || 0)}</div>
            <div className="m-stat-label">Total Projects</div>
          </div>
        </div>

        <div className="m-stat-card">
          <div className="m-stat-icon" style={{ background: 'linear-gradient(135deg, var(--success), #047857)' }}>
            <i className="fa-solid fa-users"></i>
          </div>
          <div>
            <div className="m-stat-value">{data?.employees_count || 0}</div>
            <div className="m-stat-label">Developers</div>
          </div>
        </div>

        <div className="m-stat-card">
          <div className="m-stat-icon" style={{ background: 'linear-gradient(135deg, var(--warning), #b45309)' }}>
            <i className="fa-solid fa-users-gear"></i>
          </div>
          <div>
            <div className="m-stat-value">{data?.teams_count || 0}</div>
            <div className="m-stat-label">Teams Aligned</div>
          </div>
        </div>

        <div className="m-stat-card">
          <div className="m-stat-icon" style={{ background: 'linear-gradient(135deg, var(--danger), #be123c)' }}>
            <i className="fa-solid fa-calendar-minus"></i>
          </div>
          <div>
            <div className="m-stat-value">{(data?.employee_leave_count || 0) + (data?.teamlead_leave_count || 0)}</div>
            <div className="m-stat-label">Pending Leaves</div>
          </div>
        </div>
      </div>

      <div className="m-grid">
        {/* Reports Registry */}
        <div className="dashboard-panel-card">
          <div className="panel-header">
            <h2><i className="fa-solid fa-file-invoice" style={{ color: 'var(--accent-blue)', marginRight: '8px' }}></i> Developer Activity Reports (Recent)</h2>
          </div>
          <div className="panel-body">
            <div className="table-wrap">
              <table className="dense-table">
                <thead>
                  <tr>
                    <th>Developer</th>
                    <th>Project</th>
                    <th>Date</th>
                    <th>Tasks Completed Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.daily_reports && data.daily_reports.length > 0 ? (
                    data.daily_reports.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.user_name}</td>
                        <td>{r.project_name}</td>
                        <td>{r.report_date}</td>
                        <td>{r.tasks_completed}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--muted)' }}>No reports received recently.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Leaves status alignments */}
        <div className="dashboard-panel-card">
          <div className="panel-header">
            <h2><i className="fa-solid fa-clipboard-check" style={{ color: 'var(--accent-blue)', marginRight: '8px' }}></i> Leaves Pending Manager Approval</h2>
          </div>
          <div className="panel-body" style={{ textAlign: 'left', fontSize: '13.5px', lineHeight: '1.8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px' }}>
              <span>Developer Leaves Pending:</span>
              <strong style={{ color: 'var(--danger)' }}>{data?.employee_leave_count || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px' }}>
              <span>Team Lead Leaves Pending:</span>
              <strong style={{ color: 'var(--danger)' }}>{data?.teamlead_leave_count || 0}</strong>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '10px' }}>
              * Managers must approve or reject pending leave requests before they proceed to HR.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
