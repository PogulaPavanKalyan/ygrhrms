import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Leave = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'apply' or 'approvals'
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(24);
  const [approvedCount, setApprovedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [leaveType, setLeaveType] = useState('Paid');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('');

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/api/leaves/', { params });
      setLeaves(res.data.leaves || []);
      setLeaveBalance(res.data.leave_balance ?? 24);
      setApprovedCount(res.data.approved_count ?? 0);
    } catch (err) {
      console.error('Error loading leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [statusFilter]);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/leaves/', {
        from_date: fromDate,
        to_date: toDate,
        leave_type: leaveType,
        reason,
      });
      alert('Leave request submitted successfully.');
      setFromDate('');
      setToDate('');
      setReason('');
      setActiveTab('list');
      loadLeaves();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (leaveId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this leave request?`)) return;
    try {
      await api.post(`/api/leaves/${leaveId}/action/`, { action });
      alert(`Leave request successfully ${action}ed.`);
      loadLeaves();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update leave request.');
    }
  };

  // Filter list of pending leaves for managers/HR/MD
  const pendingLeaves = leaves.filter((l) => {
    if (l.user === user?.id) return false; // exclude own
    if (l.status === 'Approved' || l.status === 'Rejected') return false;
    
    // Check role eligibility for approval
    if (role === 'TeamLead' && l.status === 'Pending TeamLead Approval') return true;
    if (role === 'Manager' && l.status === 'Pending Manager Approval') return true;
    if (role === 'HR' && l.status === 'Pending HR Approval') return true;
    if (role === 'MD' && l.status === 'Pending MD Approval') return true;
    return false;
  });

  return (
    <div>
      <style>{`
        .leave-stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        .leave-stat-card {
          background: #ffffff;
          border: 1px solid var(--border);
          border-radius: var(--border-radius);
          padding: 20px;
          text-align: left;
          box-shadow: var(--card-shadow);
        }
        .leave-stat-title {
          font-size: 0.76rem;
          color: var(--muted);
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .leave-stat-value {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--primary-color);
        }

        .leave-tabs {
          display: flex;
          gap: 10px;
          border-bottom: 2px solid var(--border);
          margin-bottom: 20px;
        }
        .leave-tab {
          padding: 10px 20px;
          cursor: pointer;
          font-weight: 700;
          color: var(--muted);
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: var(--transition-base);
        }
        .leave-tab.active {
          color: var(--accent-blue);
          border-bottom-color: var(--accent-blue);
        }
        
        .leave-form-card {
          max-width: 500px;
          margin: 0 auto;
        }
      `}</style>

      <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Leaves Portal</h2>

      {/* Stats Cards Row */}
      <div className="leave-stats-row">
        <div className="leave-stat-card" style={{ borderLeft: '3px solid var(--accent-blue)' }}>
          <div className="leave-stat-title">Leave Allowance</div>
          <div className="leave-stat-value">24 Days</div>
        </div>
        <div className="leave-stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
          <div className="leave-stat-title">Approved Leaves</div>
          <div className="leave-stat-value">{approvedCount} Days</div>
        </div>
        <div className="leave-stat-card" style={{ borderLeft: '3px solid var(--warning)' }}>
          <div className="leave-stat-title">Remaining Balance</div>
          <div className="leave-stat-value">{leaveBalance} Days</div>
        </div>
      </div>

      {/* Tab Menu */}
      <div className="leave-tabs">
        <div className={`leave-tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
          📋 Leaves Logs
        </div>
        <div className={`leave-tab ${activeTab === 'apply' ? 'active' : ''}`} onClick={() => setActiveTab('apply')}>
          ✍️ Apply Leave
        </div>
        {role !== 'Employee' && (
          <div className={`leave-tab ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>
            🛡️ Pending Approvals ({pendingLeaves.length})
          </div>
        )}
      </div>

      {/* 1. LEAVE LOGS TABLE */}
      {activeTab === 'list' && (
        <div className="dashboard-panel-card">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Leaves History</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', fontWeight: 600 }}
            >
              <option value="">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Pending TeamLead Approval">Pending TL</option>
              <option value="Pending Manager Approval">Pending Manager</option>
              <option value="Pending HR Approval">Pending HR</option>
              <option value="Pending MD Approval">Pending MD</option>
            </select>
          </div>
          <div className="panel-body">
            {loading ? (
              <div>Loading leave records...</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>From Date</th>
                      <th>To Date</th>
                      <th>Leave Type</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.length > 0 ? (
                      leaves.map((l) => (
                        <tr key={l.id}>
                          <td style={{ fontWeight: 600 }}>{l.user_full_name} ({l.user_name})</td>
                          <td>{l.from_date}</td>
                          <td>{l.to_date}</td>
                          <td>
                            <span className={`badge-capsule info`}>{l.leave_type} Leave</span>
                          </td>
                          <td>{l.reason}</td>
                          <td>
                            <span className={`badge-capsule ${l.status === 'Approved' ? 'success' : l.status === 'Rejected' ? 'danger' : 'warning'}`}>
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--muted)' }}>No leaves requests submitted.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. APPLY LEAVE FORM */}
      {activeTab === 'apply' && (
        <div className="dashboard-panel-card leave-form-card">
          <div className="panel-header">
            <h2>Apply Leave Request</h2>
          </div>
          <div className="panel-body">
            <form onSubmit={handleApplySubmit} style={{ textAlign: 'left' }}>
              <div className="form-group">
                <label>From Date</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>To Date</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Leave Category</label>
                <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <option value="Paid">Paid Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                </select>
              </div>
              <div className="form-group">
                <label>Reason for Leave</label>
                <textarea rows="4" value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="Provide reason details..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <button type="submit" className="btn" disabled={submitting} style={{ width: '100%' }}>
                {submitting ? 'Submitting request...' : 'Submit Leave Application'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. PENDING APPROVALS LIST */}
      {activeTab === 'approvals' && (
        <div className="dashboard-panel-card">
          <div className="panel-header">
            <h2>Leave Approval Registry</h2>
          </div>
          <div className="panel-body">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>From Date</th>
                    <th>To Date</th>
                    <th>Leave Type</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLeaves.length > 0 ? (
                    pendingLeaves.map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 600 }}>{l.user_full_name}</td>
                        <td>{l.from_date}</td>
                        <td>{l.to_date}</td>
                        <td>{l.leave_type}</td>
                        <td>{l.reason}</td>
                        <td>
                          <span className="badge-capsule warning">{l.status}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="download-btn" onClick={() => handleAction(l.id, 'approve')}>
                              Approve
                            </button>
                            <button className="view-btn" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }} onClick={() => handleAction(l.id, 'reject')}>
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--muted)' }}>No leave requests pending your approval.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leave;
