import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Calls = () => {
  const { user } = useAuth();

  const [calls, setCalls] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialer state
  const [selectedUserToCall, setSelectedUserToCall] = useState('');
  const [callType, setCallType] = useState('video');
  const [calling, setCalling] = useState(false);

  const loadCallsAndUsers = async () => {
    setLoading(true);
    try {
      const callsRes = await api.get('/api/calls/');
      setCalls(callsRes.data || []);

      const mdRes = await api.get('/api/dashboard/md/');
      // Exclude self
      setUsers((mdRes.data.all_users || []).filter(u => u.id !== user?.id));
    } catch (err) {
      console.error('Error loading call portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCallsAndUsers();
  }, []);

  const handleStartCall = async (e) => {
    e.preventDefault();
    if (!selectedUserToCall) return;
    setCalling(true);
    try {
      await api.post('/api/calls/', {
        receiver: selectedUserToCall,
        call_type: callType,
      });
      alert(`Initiating WebRTC ${callType} connection. Dialing peer...`);
      loadCallsAndUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to initiate calling signal.');
    } finally {
      setCalling(false);
    }
  };

  return (
    <div>
      <style>{`
        .call-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }
        @media (max-width: 768px) {
          .call-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Conference & Calls</h2>

      <div className="call-grid">
        {/* Call Log feed */}
        <div className="dashboard-panel-card" style={{ textAlign: 'left' }}>
          <div className="panel-header">
            <h2>📞 Call Logs History</h2>
          </div>
          <div className="panel-body">
            {loading ? (
              <div>Loading call logs...</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Peer Name</th>
                      <th>Direction</th>
                      <th>Call Type</th>
                      <th>Connection Status</th>
                      <th>Date / Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.length > 0 ? (
                      calls.map((c) => {
                        const isCaller = c.caller === user?.id;
                        const peerName = isCaller ? c.receiver_full_name : c.caller_full_name;
                        return (
                          <tr key={c.id}>
                            <td style={{ fontWeight: 600 }}>{peerName}</td>
                            <td>
                              <span className={`badge-capsule ${isCaller ? 'info' : 'success'}`}>
                                {isCaller ? 'Outgoing' : 'Incoming'}
                              </span>
                            </td>
                            <td>{c.call_type === 'video' ? '📹 Video Call' : '📞 Voice Call'}</td>
                            <td>
                              <span className={`badge-capsule ${c.status === 'ended' ? 'info' : c.status === 'missed' ? 'danger' : 'warning'}`}>
                                {c.status}
                              </span>
                            </td>
                            <td style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                              {new Date(c.created_at).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)' }}>No calling log history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Dialer Panel */}
        <div className="dashboard-panel-card" style={{ height: 'fit-content' }}>
          <div className="panel-header">
            <h2>Dialer Pad</h2>
          </div>
          <div className="panel-body">
            <form onSubmit={handleStartCall} style={{ textAlign: 'left' }}>
              <div className="form-group">
                <label>Select Colleague</label>
                <select value={selectedUserToCall} onChange={(e) => setSelectedUserToCall(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <option value="">Choose Staff...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Call Configuration</label>
                <select value={callType} onChange={(e) => setCallType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <option value="video">📹 Video Conference Call</option>
                  <option value="voice">📞 Voice Call Only</option>
                </select>
              </div>

              <button type="submit" className="btn" disabled={calling} style={{ width: '100%', marginTop: '15px' }}>
                {calling ? 'Initiating Signalling...' : 'Initiate WebRTC Call'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calls;
