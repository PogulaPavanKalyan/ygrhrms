import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TLDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTLData = async () => {
      try {
        const res = await api.get('/api/dashboard/teamlead/');
        setData(res.data);
      } catch (err) {
        console.error('Error fetching Team Lead dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTLData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: 'var(--muted)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginRight: '10px' }}></i> Loading workspace...
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .tl-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }
        .tl-stat-card {
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
        .tl-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          color: #ffffff;
        }
        .tl-stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--primary-color);
          line-height: 1.2;
        }
        .tl-stat-label {
          font-size: 0.8rem;
          color: var(--muted);
          font-weight: 600;
          text-transform: uppercase;
        }
        .tl-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        @media (max-width: 1024px) {
          .tl-grid {
            grid-template-columns: 1fr;
          }
        }
        .project-item {
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 12px;
          text-align: left;
        }
        .project-name {
          font-weight: 700;
          color: var(--primary-color);
          font-size: 14px;
          margin-bottom: 4px;
        }
        .project-desc {
          font-size: 12.5px;
          color: var(--text-secondary);
          line-height: 1.4;
        }
      `}</style>

      <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Team Lead Workspace</h2>

      {/* Stats Row */}
      <div className="tl-stats-grid">
        <div className="tl-stat-card">
          <div className="tl-stat-icon" style={{ background: 'linear-gradient(135deg, var(--accent-blue), #1d4ed8)' }}>
            <i className="fa-solid fa-folder-open"></i>
          </div>
          <div>
            <div className="tl-stat-value">{data?.projects_count || 0}</div>
            <div className="tl-stat-label">Active Projects</div>
          </div>
        </div>

        <div className="tl-stat-card">
          <div className="tl-stat-icon" style={{ background: 'linear-gradient(135deg, var(--success), #047857)' }}>
            <i className="fa-solid fa-users"></i>
          </div>
          <div>
            <div className="tl-stat-value">{data?.members_count || 0}</div>
            <div className="tl-stat-label">Assigned Developers</div>
          </div>
        </div>
      </div>

      <div className="tl-grid">
        {/* Developers Status table */}
        <div className="dashboard-panel-card">
          <div className="panel-header">
            <h2><i className="fa-solid fa-clipboard-user" style={{ color: 'var(--accent-blue)', marginRight: '8px' }}></i> Developer Registries (Today)</h2>
          </div>
          <div className="panel-body">
            <div className="table-wrap">
              <table className="dense-table">
                <thead>
                  <tr>
                    <th>Developer</th>
                    <th>Check In</th>
                    <th>Attendance</th>
                    <th>Active Task</th>
                    <th>Task Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.member_status_list && data.member_status_list.length > 0 ? (
                    data.member_status_list.map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600 }}>{m.name} ({m.emp_id})</td>
                        <td>{m.check_in}</td>
                        <td>
                          <span className={`badge-capsule ${m.attendance_status === 'Present' ? 'success' : m.attendance_status === 'Absent' ? 'danger' : 'warning'}`}>
                            {m.attendance_status}
                          </span>
                        </td>
                        <td>{m.current_task}</td>
                        <td>
                          {m.task_status !== '—' ? (
                            <span className={`badge-capsule ${m.task_status === 'Completed' ? 'success' : m.task_status === 'Submitted' ? 'info' : 'warning'}`}>
                              {m.task_status}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)' }}>No developers assigned in this team.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Assigned Projects list */}
        <div className="dashboard-panel-card">
          <div className="panel-header">
            <h2><i className="fa-solid fa-folder" style={{ color: 'var(--accent-blue)', marginRight: '8px' }}></i> Team Projects</h2>
          </div>
          <div className="panel-body">
            {data?.projects && data.projects.length > 0 ? (
              data.projects.map((p) => (
                <div className="project-item" key={p.id}>
                  <div className="project-name">{p.project_name}</div>
                  <div className="project-desc">{p.description || 'No description provided.'}</div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'left' }}>No projects assigned yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming tasks milestones table */}
      <div className="dashboard-panel-card">
        <div className="panel-header">
          <h2><i className="fa-solid fa-list-check" style={{ color: 'var(--accent-blue)', marginRight: '8px' }}></i> Tasks Deadlines & Submissions</h2>
        </div>
        <div className="panel-body">
          <div className="table-wrap">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Project</th>
                  <th>End Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.upcoming_tasks && data.upcoming_tasks.length > 0 ? (
                  data.upcoming_tasks.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.task_name}</td>
                      <td>{t.project_name}</td>
                      <td>{t.end_date}</td>
                      <td>
                        <span className={`badge-capsule ${t.status === 'Completed' ? 'success' : t.status === 'Submitted' ? 'info' : 'warning'}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--muted)' }}>No pending tasks deadlines.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TLDashboard;
