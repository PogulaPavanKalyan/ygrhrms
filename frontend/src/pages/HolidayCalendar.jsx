import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const HolidayCalendar = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Holiday creation state
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayDept, setHolidayDept] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/holidays/');
      setHolidays(res.data);
    } catch (err) {
      console.error('Error loading holidays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/holidays/', {
        name: holidayName,
        date: holidayDate,
        department: holidayDept,
      });
      alert('Holiday created successfully.');
      setHolidayName('');
      setHolidayDate('');
      setHolidayDept('');
      loadHolidays();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create holiday.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (holidayId) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await api.delete(`/api/holidays/${holidayId}/`);
      alert('Holiday deleted.');
      loadHolidays();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete holiday.');
    }
  };

  return (
    <div>
      <style>{`
        .holiday-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
        }
        @media (max-width: 768px) {
          .holiday-grid {
            grid-template-columns: 1fr;
          }
        }
        .holiday-list-card {
          text-align: left;
        }
        .holiday-item {
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .holiday-details {
          display: flex;
          flex-direction: column;
        }
        .holiday-title {
          font-weight: 700;
          color: var(--primary-color);
          font-size: 14px;
        }
        .holiday-date {
          font-size: 12.5px;
          color: var(--muted);
          margin-top: 2px;
        }
        .holiday-dept-badge {
          display: inline-block;
          font-size: 10px;
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
          padding: 2px 6px;
          border-radius: 4px;
          margin-top: 4px;
          font-weight: 600;
        }
      `}</style>

      <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Holiday Registry</h2>

      <div className="holiday-grid">
        {/* Holidays List */}
        <div className="dashboard-panel-card holiday-list-card">
          <div className="panel-header">
            <h2>📅 Corporate Holidays</h2>
          </div>
          <div className="panel-body">
            {loading ? (
              <div>Loading holidays...</div>
            ) : holidays.length > 0 ? (
              holidays.map((h) => (
                <div className="holiday-item" key={h.id}>
                  <div className="holiday-details">
                    <span className="holiday-title">{h.name}</span>
                    <span className="holiday-date">
                      <i className="fa-regular fa-calendar" style={{ marginRight: '6px' }}></i>
                      {new Date(h.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    {h.department && (
                      <div>
                        <span className="holiday-dept-badge">{h.department.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>
                  {['HR', 'MD'].includes(role) && (
                    <button
                      className="view-btn"
                      style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer' }}
                      onClick={() => handleDelete(h.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '13px' }}>No corporate holidays scheduled.</p>
            )}
          </div>
        </div>

        {/* Add Holiday Form (for HR/MD) */}
        {['HR', 'MD'].includes(role) && (
          <div className="dashboard-panel-card">
            <div className="panel-header">
              <h2>✍️ Schedule Holiday</h2>
            </div>
            <div className="panel-body">
              <form onSubmit={handleCreateSubmit} style={{ textAlign: 'left' }}>
                <div className="form-group">
                  <label>Holiday Description / Name</label>
                  <input
                    type="text"
                    value={holidayName}
                    onChange={(e) => setHolidayName(e.target.value)}
                    required
                    placeholder="e.g. Independence Day"
                  />
                </div>
                <div className="form-group">
                  <label>Holiday Date</label>
                  <input
                    type="date"
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Department Scope (Optional)</label>
                  <input
                    type="text"
                    value={holidayDept}
                    onChange={(e) => setHolidayDept(e.target.value)}
                    placeholder="e.g. technology (leave blank for all)"
                  />
                </div>
                <button type="submit" className="btn" disabled={submitting} style={{ width: '100%' }}>
                  {submitting ? 'Scheduling holiday...' : 'Add to Holiday Calendar'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidayCalendar;
