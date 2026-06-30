import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Tasks = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [activeTab, setActiveTab] = useState('board'); // 'board' or 'daily-reports' or 'assign'
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Task assignment form state (TL/Manager/HR/MD only)
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [assigning, setAssigning] = useState(false);

  // Daily report form state
  const [reportProject, setReportProject] = useState('');
  const [tasksCompleted, setTasksCompleted] = useState('');
  const [tasksInProgress, setTasksInProgress] = useState('');
  const [reportIssues, setReportIssues] = useState('');
  const [planTomorrow, setPlanTomorrow] = useState('');
  const [reporting, setReporting] = useState(false);

  // Task submit details state
  const [selectedTaskToSubmit, setSelectedTaskToSubmit] = useState(null);
  const [submissionRemarks, setSubmissionRemarks] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const tasksRes = await api.get('/api/tasks/');
      setTasks(tasksRes.data);

      const projectsRes = await api.get('/api/projects/');
      setProjects(projectsRes.data);

      const reportsRes = await api.get('/api/daily-reports/');
      setReports(reportsRes.data);

      if (['TeamLead', 'Manager', 'HR', 'MD'].includes(role)) {
        const usersRes = await api.get('/api/users/');
        setAllUsers(usersRes.data || []);
      }
    } catch (err) {
      console.error('Error loading task management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setAssigning(true);
    try {
      await api.post('/api/tasks/', {
        task_name: newTaskName,
        description: newTaskDesc,
        project: selectedProject,
        start_date: startDate,
        end_date: endDate,
        members: assignedMembers,
      });
      alert('Task assigned successfully.');
      setNewTaskName('');
      setNewTaskDesc('');
      setSelectedProject('');
      setStartDate('');
      setEndDate('');
      setAssignedMembers([]);
      setActiveTab('board');
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to assign task.');
    } finally {
      setAssigning(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setReporting(true);
    try {
      await api.post('/api/daily-reports/', {
        project: reportProject,
        tasks_completed: tasksCompleted,
        tasks_in_progress: tasksInProgress,
        issues: reportIssues,
        plan_for_tomorrow: planTomorrow,
      });
      alert('Daily report submitted.');
      setReportProject('');
      setTasksCompleted('');
      setTasksInProgress('');
      setReportIssues('');
      setPlanTomorrow('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit report.');
    } finally {
      setReporting(false);
    }
  };

  const handleTaskSubmitAction = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('status', 'Submitted');
      formData.append('remarks', submissionRemarks);
      if (submissionFile) {
        formData.append('file', submissionFile);
      }
      await api.put(`/api/tasks/${selectedTaskToSubmit.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Task submitted successfully.');
      setSelectedTaskToSubmit(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit task.');
    }
  };

  const handleMemberSelect = (e) => {
    const values = Array.from(e.target.selectedOptions, (option) => option.value);
    setAssignedMembers(values);
  };

  return (
    <div>
      <style>{`
        .task-tabs {
          display: flex;
          gap: 10px;
          border-bottom: 2px solid var(--border);
          margin-bottom: 20px;
        }
        .task-tab {
          padding: 10px 20px;
          cursor: pointer;
          font-weight: 700;
          color: var(--muted);
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: var(--transition-base);
        }
        .task-tab.active {
          color: var(--accent-blue);
          border-bottom-color: var(--accent-blue);
        }
        .task-grid-panel {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .task-grid-panel {
            grid-template-columns: 1fr;
          }
        }
        .report-item {
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 15px;
          text-align: left;
        }
        .report-meta {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 6px;
          margin-bottom: 8px;
          font-size: 12px;
          color: var(--muted);
          font-weight: 600;
        }
      `}</style>

      <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Workspace Tasks & Reports</h2>

      {/* Tabs */}
      <div className="task-tabs">
        <div className={`task-tab ${activeTab === 'board' ? 'active' : ''}`} onClick={() => setActiveTab('board')}>
          📋 Tasks Board
        </div>
        <div className={`task-tab ${activeTab === 'daily-reports' ? 'active' : ''}`} onClick={() => setActiveTab('daily-reports')}>
          ✍️ Daily Progress Reports
        </div>
        {['TeamLead', 'Manager', 'HR', 'MD'].includes(role) && (
          <div className={`task-tab ${activeTab === 'assign' ? 'active' : ''}`} onClick={() => setActiveTab('assign')}>
            Assign Tasks
          </div>
        )}
      </div>

      {loading ? (
        <div>Loading workspace registry...</div>
      ) : (
        <div>
          {/* 1. TASKS BOARD VIEW */}
          {activeTab === 'board' && (
            <div className="dashboard-panel-card">
              <div className="panel-header">
                <h2>Assigned Workspace Tasks</h2>
              </div>
              <div className="panel-body">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Task Name</th>
                        <th>Project</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.length > 0 ? (
                        tasks.map((t) => (
                          <tr key={t.id}>
                            <td style={{ fontWeight: 600 }}>{t.task_name}</td>
                            <td>{t.project?.project_name || 'General'}</td>
                            <td>{t.start_date}</td>
                            <td>{t.end_date}</td>
                            <td>
                              <span className={`badge-capsule ${t.status === 'Completed' ? 'success' : t.status === 'Submitted' ? 'info' : 'warning'}`}>
                                {t.status}
                              </span>
                            </td>
                            <td>
                              {t.status === 'Pending' ? (
                                <button className="view-btn" onClick={() => setSelectedTaskToSubmit(t)}>
                                  Submit completion
                                </button>
                              ) : (
                                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Finalized</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--muted)' }}>No tasks assigned in this scope.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. DAILY PROGRESS REPORTS VIEW */}
          {activeTab === 'daily-reports' && (
            <div className="task-grid-panel">
              {/* Daily Reports feed list */}
              <div className="dashboard-panel-card">
                <div className="panel-header">
                  <h2>Recent Reports List</h2>
                </div>
                <div className="panel-body">
                  {reports.length > 0 ? (
                    reports.map((r) => (
                      <div className="report-item" key={r.id}>
                        <div className="report-meta">
                          <span>👤 {r.user_full_name} ({r.user_name})</span>
                          <span>📅 {r.report_date}</span>
                        </div>
                        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                          <p><b>Project Scope:</b> {r.project_name || 'General'}</p>
                          <p><b>Tasks Completed:</b> {r.tasks_completed}</p>
                          {r.tasks_in_progress && <p><b>Tasks in Progress:</b> {r.tasks_in_progress}</p>}
                          {r.issues && <p style={{ color: 'var(--danger)' }}><b>Issues / Bottlenecks:</b> {r.issues}</p>}
                          {r.plan_for_tomorrow && <p><b>Tomorrow's Alignment:</b> {r.plan_for_tomorrow}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--muted)' }}>No daily status reports submitted.</p>
                  )}
                </div>
              </div>

              {/* Submit Daily Report Form */}
              <div className="dashboard-panel-card" style={{ height: 'fit-content' }}>
                <div className="panel-header">
                  <h2>Submit Daily report status</h2>
                </div>
                <div className="panel-body">
                  <form onSubmit={handleReportSubmit} style={{ textAlign: 'left' }}>
                    <div className="form-group">
                      <label>Project Scope</label>
                      <select value={reportProject} onChange={(e) => setReportProject(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        <option value="">General / None</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.project_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Tasks Completed Details</label>
                      <textarea rows="3" value={tasksCompleted} onChange={(e) => setTasksCompleted(e.target.value)} required placeholder="Description of completed tasks..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                    </div>
                    <div className="form-group">
                      <label>Tasks in Progress</label>
                      <textarea rows="2" value={tasksInProgress} onChange={(e) => setTasksInProgress(e.target.value)} placeholder="Pending modules description..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                    </div>
                    <div className="form-group">
                      <label>Issues / Blockers</label>
                      <textarea rows="2" value={reportIssues} onChange={(e) => setReportIssues(e.target.value)} placeholder="State blockers if any..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                    </div>
                    <div className="form-group">
                      <label>Plan for Tomorrow</label>
                      <textarea rows="2" value={planTomorrow} onChange={(e) => setPlanTomorrow(e.target.value)} placeholder="Next steps alignment..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                    </div>
                    <button type="submit" className="btn" disabled={reporting} style={{ width: '100%' }}>
                      {reporting ? 'Uploading report...' : 'Submit Daily Status'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* 3. ASSIGN TASK VIEW */}
          {activeTab === 'assign' && (
            <div className="dashboard-panel-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div className="panel-header">
                <h2>Assign a new Task</h2>
              </div>
              <div className="panel-body">
                <form onSubmit={handleAssignSubmit} style={{ textAlign: 'left' }}>
                  <div className="form-group">
                    <label>Task Description Name</label>
                    <input type="text" value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} required placeholder="e.g. Design Dashboard Login layout" />
                  </div>
                  <div className="form-group">
                    <label>Description Details</label>
                    <textarea rows="3" value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} placeholder="Detailed parameters..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                  </div>
                  <div className="form-group">
                    <label>Project Alignment</label>
                    <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <option value="">Select Project...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.project_name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label>Start Date</label>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Select Team Members (Hold Ctrl to choose multiple)</label>
                    <select multiple value={assignedMembers} onChange={handleMemberSelect} style={{ width: '100%', height: '140px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      {allUsers.filter((u) => u.role === 'Employee' || u.role === 'TeamLead').map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn" disabled={assigning} style={{ width: '100%', marginTop: '10px' }}>
                    {assigning ? 'Assigning tasks...' : 'Assign Task'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TASK SUBMIT MODAL */}
      {selectedTaskToSubmit && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Submit Task Completion</h3>
              <button className="modal-close" onClick={() => setSelectedTaskToSubmit(null)}>×</button>
            </div>
            <form onSubmit={handleTaskSubmitAction} style={{ textAlign: 'left' }}>
              <div className="form-group">
                <label>Task</label>
                <input type="text" value={selectedTaskToSubmit.task_name} disabled style={{ background: '#f1f5f9' }} />
              </div>
              <div className="form-group">
                <label>Remarks</label>
                <textarea rows="3" value={submissionRemarks} onChange={(e) => setSubmissionRemarks(e.target.value)} required placeholder="Provide status completion remarks details..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <div className="form-group">
                <label>Upload Document Proof (Optional)</label>
                <input type="file" onChange={(e) => setSubmissionFile(e.target.files[0])} style={{ padding: '6px 0' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn" style={{ background: '#64748b', marginTop: 0 }} onClick={() => setSelectedTaskToSubmit(null)}>Cancel</button>
                <button type="submit" className="btn" style={{ marginTop: 0 }}>Submit Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
