import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Attendance = () => {
  const { user } = useAuth();
  const role = user?.role;

  // View state: 'calendar' or 'registry' or 'corrections'
  const [activeTab, setActiveTab] = useState(role === 'Employee' ? 'calendar' : 'registry');
  
  // Detailed Calendar state
  const [targetUserId, setTargetUserId] = useState(role === 'Employee' ? '' : 'me');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [calendarData, setCalendarData] = useState(null);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  // Registry state (for TL/Manager/HR/MD)
  const [registryRecords, setRegistryRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loadingRegistry, setLoadingRegistry] = useState(false);

  // Corrections state
  const [corrections, setCorrections] = useState([]);
  const [loadingCorrections, setLoadingCorrections] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedRecordToCorrect, setSelectedRecordToCorrect] = useState(null);
  const [newCheckIn, setNewCheckIn] = useState('09:00');
  const [newCheckOut, setNewCheckOut] = useState('18:00');
  const [correctionReason, setCorrectionReason] = useState('');

  // Subordinates list for Manager/TL/HR
  const [subordinates, setSubordinates] = useState([]);

  // Load calendar data
  const loadCalendar = async () => {
    setLoadingCalendar(true);
    try {
      const params = {
        month: selectedMonth,
        year: selectedYear,
      };
      if (targetUserId) {
        params.user_id = targetUserId;
      }
      const res = await api.get('/api/attendance/', { params });
      setCalendarData(res.data);
    } catch (err) {
      console.error('Error loading attendance calendar:', err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  // Load registry data
  const loadRegistry = async () => {
    setLoadingRegistry(true);
    try {
      const params = {};
      if (searchQuery) params.q = searchQuery;
      if (filterDate) params.date = filterDate;
      const res = await api.get('/api/attendance/', { params });
      setRegistryRecords(res.data);
    } catch (err) {
      console.error('Error loading attendance registry:', err);
    } finally {
      setLoadingRegistry(false);
    }
  };

  // Load corrections
  const loadCorrections = async () => {
    setLoadingCorrections(true);
    try {
      const res = await api.get('/api/attendance/corrections/');
      setCorrections(res.data);
    } catch (err) {
      console.error('Error loading corrections:', err);
    } finally {
      setLoadingCorrections(false);
    }
  };

  // Load initial options
  useEffect(() => {
    if (activeTab === 'calendar') {
      loadCalendar();
    } else if (activeTab === 'registry') {
      loadRegistry();
    } else if (activeTab === 'corrections') {
      loadCorrections();
    }
  }, [activeTab, selectedMonth, selectedYear, targetUserId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadRegistry();
  };

  const handleOpenCorrectionModal = (record) => {
    setSelectedRecordToCorrect(record);
    setNewCheckIn(record.check_in_time ? record.check_in_time.substring(11, 16) : '09:00');
    setNewCheckOut(record.check_out_time ? record.check_out_time.substring(11, 16) : '18:00');
    setCorrectionReason('');
    setShowCorrectionModal(true);
  };

  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/attendance/corrections/', {
        attendance_id: selectedRecordToCorrect.id,
        new_check_in: newCheckIn,
        new_check_out: newCheckOut,
        reason: correctionReason,
      });
      alert('Attendance correction request submitted.');
      setShowCorrectionModal(false);
      loadCalendar();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit correction.');
    }
  };

  const handleCorrectionAction = async (correctionId, action) => {
    const md_remarks = prompt('Enter approval/rejection remarks:');
    if (md_remarks === null) return; // user cancelled
    try {
      await api.post(`/api/attendance/corrections/${correctionId}/action/`, {
        action,
        md_remarks,
      });
      alert(`Correction request ${action}ed.`);
      loadCorrections();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to execute action.');
    }
  };

  // Render helpers
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <div>
      <style>{`
        .attendance-tabs {
          display: flex;
          gap: 10px;
          border-bottom: 2px solid var(--border);
          margin-bottom: 20px;
        }
        .attendance-tab {
          padding: 10px 20px;
          cursor: pointer;
          font-weight: 700;
          color: var(--muted);
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: var(--transition-base);
        }
        .attendance-tab.active {
          color: var(--accent-blue);
          border-bottom-color: var(--accent-blue);
        }

        /* CALENDAR GRID */
        .calendar-wrapper {
          background: #ffffff;
          border: 1px solid var(--border);
          border-radius: var(--border-radius);
          padding: 20px;
          margin-bottom: 20px;
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }
        .calendar-controls {
          display: flex;
          gap: 10px;
        }
        .calendar-controls select {
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid var(--border);
          font-weight: 600;
        }
        .calendar-grid-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          font-weight: 700;
          color: var(--muted);
          text-align: center;
          margin-bottom: 10px;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        .calendar-day-cell {
          aspect-ratio: 1.2;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 6px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
          position: relative;
          min-height: 70px;
        }
        .day-num {
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--primary-color);
        }
        .day-status {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          margin-top: 4px;
        }
        .day-time {
          font-size: 0.68rem;
          color: var(--muted);
        }
        
        /* Cell color definitions */
        .cell-present { background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.3); }
        .cell-present .day-status { color: #10b981; }
        .cell-absent { background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.3); }
        .cell-absent .day-status { color: #ef4444; }
        .cell-holiday { background: rgba(59, 130, 246, 0.08); border-color: rgba(59, 130, 246, 0.3); }
        .cell-holiday .day-status { color: #3b82f6; }
        .cell-weekoff { background: rgba(226, 232, 240, 0.4); border-color: rgba(203, 213, 225, 0.5); }
        .cell-weekoff .day-status { color: #64748b; }
        .cell-leave { background: rgba(245, 158, 11, 0.08); border-color: rgba(245, 158, 11, 0.3); }
        .cell-leave .day-status { color: #f59e0b; }

        /* MODAL */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-container {
          background: #ffffff;
          border-radius: var(--border-radius);
          padding: 24px;
          max-width: 450px;
          width: 90%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
          text-align: left;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .modal-header h3 {
          margin: 0;
          font-size: 1.15rem;
          color: var(--primary-color);
          font-weight: 700;
        }
        .modal-close {
          border: none;
          background: none;
          cursor: pointer;
          font-size: 1.2rem;
          color: var(--muted);
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--primary-color);
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        .form-group input, .form-group textarea {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid var(--border);
        }
      `}</style>

      <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Attendance & Check Logs</h2>

      <div className="attendance-tabs">
        {role !== 'Employee' && (
          <div className={`attendance-tab ${activeTab === 'registry' ? 'active' : ''}`} onClick={() => setActiveTab('registry')}>
            📁 Attendance Registry
          </div>
        )}
        <div className={`attendance-tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          📅 Calendar detailed logs
        </div>
        <div className={`attendance-tab ${activeTab === 'corrections' ? 'active' : ''}`} onClick={() => setActiveTab('corrections')}>
          🛠️ Correction Requests
        </div>
      </div>

      {/* 1. REGISTRY VIEW */}
      {activeTab === 'registry' && (
        <div>
          {/* Stats Row - matching Django attendance_list.html */}
          <style>{`
            .att-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 28px; }
            .att-stat-card { background: #fff; border-radius: 20px; padding: 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); border: 1px solid #e2e8f0; transition: all 0.3s; position: relative; overflow: hidden; }
            .att-stat-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); border-color: #cbd5e1; }
            .att-stat-card::after { content: ""; position: absolute; bottom: 0; left: 0; width: 100%; height: 4px; }
            .att-stat-card.total-card::after { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
            .att-stat-card.present-card::after { background: linear-gradient(90deg, #10b981, #34d399); }
            .att-stat-card.half-card::after { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
            .att-stat-card.absent-card::after { background: linear-gradient(90deg, #ef4444, #f87171); }
            .att-stat-info { display: flex; flex-direction: column; gap: 4px; }
            .att-stat-label { font-size: 0.78rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
            .att-stat-value { font-size: 2rem; font-weight: 800; color: #0f172a; line-height: 1; }
            .att-stat-icon { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
            .icon-total { background: rgba(59,130,246,0.1); color: #3b82f6; }
            .icon-present { background: rgba(16,185,129,0.1); color: #10b981; }
            .icon-half { background: rgba(245,158,11,0.1); color: #f59e0b; }
            .icon-absent { background: rgba(239,68,68,0.1); color: #ef4444; }
            @media (max-width: 1200px) { .att-stats-row { grid-template-columns: repeat(2, 1fr); } }
            @media (max-width: 768px) { .att-stats-row { grid-template-columns: 1fr; } }
          `}</style>
          <div className="att-stats-row">
            <div className="att-stat-card total-card">
              <div className="att-stat-info">
                <span className="att-stat-label">Total Logs</span>
                <span className="att-stat-value">{registryRecords.length}</span>
              </div>
              <div className="att-stat-icon icon-total"><i className="fa-solid fa-users"></i></div>
            </div>
            <div className="att-stat-card present-card">
              <div className="att-stat-info">
                <span className="att-stat-label">Presents</span>
                <span className="att-stat-value">{registryRecords.filter(r => r.status?.toLowerCase().includes('present')).length}</span>
              </div>
              <div className="att-stat-icon icon-present"><i className="fa-solid fa-circle-check"></i></div>
            </div>
            <div className="att-stat-card half-card">
              <div className="att-stat-info">
                <span className="att-stat-label">Half Days</span>
                <span className="att-stat-value">{registryRecords.filter(r => r.status?.toLowerCase().includes('half')).length}</span>
              </div>
              <div className="att-stat-icon icon-half"><i className="fa-solid fa-circle-half-stroke"></i></div>
            </div>
            <div className="att-stat-card absent-card">
              <div className="att-stat-info">
                <span className="att-stat-label">Absents</span>
                <span className="att-stat-value">{registryRecords.filter(r => r.status?.toLowerCase().includes('absent')).length}</span>
              </div>
              <div className="att-stat-icon icon-absent"><i className="fa-solid fa-circle-xmark"></i></div>
            </div>
          </div>

          <div className="dashboard-panel-card">
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <h2>Attendance Log Sheet <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '3px 10px', borderRadius: 20, marginLeft: 8 }}>{registryRecords.length} records</span></h2>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Search staff ID/name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                />
                <button type="submit" className="btn" style={{ padding: '6px 12px', marginTop: 0 }}>Filter</button>
              </form>
            </div>
            <div className="panel-body">
              {loadingRegistry ? (
                <div>Loading records...</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Staff</th>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Total Hours</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registryRecords.length > 0 ? (
                        registryRecords.map((r) => (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 600 }}>{r.user?.first_name ? `${r.user.first_name} ${r.user.last_name || ''}` : r.user?.username} ({r.user?.emp_id})</td>
                            <td>{r.date}</td>
                             <td>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                 <span>{r.check_in_time ? r.check_in_time.substring(11, 19) : '--'}</span>
                                 {r.check_in_photo && (
                                   <a href={r.check_in_photo.startsWith('http') ? r.check_in_photo : `${(import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')}${r.check_in_photo}`} target="_blank" rel="noreferrer">
                                     <img 
                                       src={r.check_in_photo.startsWith('http') ? r.check_in_photo : `${(import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')}${r.check_in_photo}`} 
                                       alt="Check In" 
                                       style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border)', cursor: 'zoom-in' }} 
                                     />
                                   </a>
                                 )}
                               </div>
                             </td>
                             <td>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                 <span>{r.check_out_time ? r.check_out_time.substring(11, 19) : '--'}</span>
                                 {r.check_out_photo && (
                                   <a href={r.check_out_photo.startsWith('http') ? r.check_out_photo : `${(import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')}${r.check_out_photo}`} target="_blank" rel="noreferrer">
                                     <img 
                                       src={r.check_out_photo.startsWith('http') ? r.check_out_photo : `${(import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')}${r.check_out_photo}`} 
                                       alt="Check Out" 
                                       style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border)', cursor: 'zoom-in' }} 
                                     />
                                   </a>
                                 )}
                               </div>
                             </td>
                            <td>{r.total_hours} hrs</td>
                            <td>
                              <span className={`badge-capsule ${r.status?.toLowerCase().includes('present') ? 'success' : r.status?.toLowerCase().includes('absent') ? 'danger' : 'warning'}`}>
                                {r.status}
                              </span>
                            </td>
                            <td>
                              <button className="view-btn" onClick={() => { setTargetUserId(r.user.id); setActiveTab('calendar'); }}>
                                👁 View calendar
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--muted)' }}>No logs found for filters.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. CALENDAR DETAILED VIEW */}
      {activeTab === 'calendar' && (
        <div>
          <div className="calendar-wrapper">
            <div className="calendar-header">
              <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--primary-color)' }}>
                📅 Monthly overview calendar
              </h3>
              <div className="calendar-controls">
                {role !== 'Employee' && (
                  <button className="btn" style={{ background: '#64748b', marginTop: 0 }} onClick={() => { setTargetUserId('me'); }}>
                    My logs
                  </button>
                )}
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
            </div>

            {loadingCalendar ? (
              <div>Loading calendar...</div>
            ) : (
              <div>
                {/* Stats indicators grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Present</span>
                    <div style={{ fontSize: '1.25rem', color: '#10b981', fontWeight: '800' }}>{calendarData?.stats?.present || 0}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Absent</span>
                    <div style={{ fontSize: '1.25rem', color: '#ef4444', fontWeight: '800' }}>{calendarData?.stats?.absent || 0}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Holidays</span>
                    <div style={{ fontSize: '1.25rem', color: '#3b82f6', fontWeight: '800' }}>{calendarData?.stats?.holiday || 0}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Late In</span>
                    <div style={{ fontSize: '1.25rem', color: '#f59e0b', fontWeight: '800' }}>{calendarData?.stats?.late || 0}</div>
                  </div>
                </div>

                <div className="calendar-grid-header">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>

                <div className="calendar-grid">
                  {/* Padding cells */}
                  {calendarData?.padding && Array.from({ length: calendarData.padding }).map((_, i) => (
                    <div key={`pad-${i}`} className="calendar-day-cell" style={{ visibility: 'hidden' }} />
                  ))}

                  {/* Day cells */}
                  {calendarData?.days_data && calendarData.days_data.map((day) => {
                    const statusClass = 
                      day.status === 'Present' ? 'cell-present' :
                      day.status === 'Absent' ? 'cell-absent' :
                      day.status === 'Holiday' ? 'cell-holiday' :
                      day.status === 'Week Off' ? 'cell-weekoff' :
                      (day.status === 'Leave' || day.status === 'Paid Leave') ? 'cell-leave' : '';

                    return (
                      <div key={day.date} className={`calendar-day-cell ${statusClass}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span className="day-num">{new Date(day.date).getDate()}</span>
                          {day.status === 'Absent' && (
                            <button
                              style={{ border: 'none', background: 'none', color: '#3b82f6', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                              onClick={() => handleOpenCorrectionModal({ id: day.id, date: day.date, check_in_time: '', check_out_time: '' })}
                            >
                              Correct
                            </button>
                          )}
                        </div>
                        <div className="day-status">{day.status}</div>
                        {day.check_in && day.check_in !== '--' && (
                          <div className="day-time">🕒 {day.check_in.substring(0, 5)} - {day.check_out?.substring(0, 5)}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. CORRECTIONS VIEW */}
      {activeTab === 'corrections' && (
        <div className="dashboard-panel-card">
          <div className="panel-header">
            <h2>🛠️ Corrections tracking list</h2>
          </div>
          <div className="panel-body">
            {loadingCorrections ? (
              <div>Loading corrections...</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Date</th>
                      <th>Proposed Time</th>
                      <th>Reason</th>
                      <th>Status</th>
                      {['HR', 'MD'].includes(role) && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {corrections.length > 0 ? (
                      corrections.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600 }}>{c.user_name}</td>
                          <td>{c.date}</td>
                          <td>
                            🕒 {c.new_check_in ? c.new_check_in.substring(11, 16) : '--'} - {c.new_check_out ? c.new_check_out.substring(11, 16) : '--'}
                          </td>
                          <td>{c.reason}</td>
                          <td>
                            <span className={`badge-capsule ${c.status === 'Approved' ? 'success' : c.status === 'Rejected' ? 'danger' : 'warning'}`}>
                              {c.status}
                            </span>
                          </td>
                          {['HR', 'MD'].includes(role) && (
                            <td>
                              {c.status === 'Pending' ? (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="download-btn" onClick={() => handleCorrectionAction(c.id, 'approve')}>
                                    Approve
                                  </button>
                                  <button className="view-btn" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }} onClick={() => handleCorrectionAction(c.id, 'reject')}>
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{c.status}</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--muted)' }}>No corrections found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CORRECTION MODAL */}
      {showCorrectionModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Submit Attendance Correction</h3>
              <button className="modal-close" onClick={() => setShowCorrectionModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitCorrection}>
              <div className="form-group">
                <label>Date</label>
                <input type="text" value={selectedRecordToCorrect?.date} disabled style={{ background: '#f1f5f9' }} />
              </div>
              <div className="form-group">
                <label>Correct Check In</label>
                <input type="time" value={newCheckIn} onChange={(e) => setNewCheckIn(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Correct Check Out</label>
                <input type="time" value={newCheckOut} onChange={(e) => setNewCheckOut(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Reason for correction</label>
                <textarea rows="3" value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)} required placeholder="State reason (e.g. forgot check-in / biometric issues)" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn" style={{ background: '#64748b', marginTop: 0 }} onClick={() => setShowCorrectionModal(false)}>Cancel</button>
                <button type="submit" className="btn" style={{ marginTop: 0 }}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
