import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Settings = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [sandwichLeave, setSandwichLeave] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/hr-settings/');
      setSandwichLeave(res.data.sandwich_leave_enabled ?? false);
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggle = async (e) => {
    const val = e.target.checked;
    setSandwichLeave(val);
    setSaving(true);
    try {
      await api.put('/api/hr-settings/', { sandwich_leave_enabled: val });
      alert(`Sandwich leave policy has been ${val ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update settings.');
      setSandwichLeave(!val); // revert on error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>HR Management Settings</h2>

      <div className="dashboard-panel-card" style={{ maxWidth: '600px', textAlign: 'left' }}>
        <div className="panel-header">
          <h2><i className="fa-solid fa-gears" style={{ color: 'var(--accent-blue)', marginRight: '8px' }}></i> Policy Configuration</h2>
        </div>
        <div className="panel-body">
          {loading ? (
            <div>Loading settings...</div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <input
                    type="checkbox"
                    checked={sandwichLeave}
                    onChange={handleToggle}
                    disabled={role !== 'HR' && role !== 'MD'}
                    style={{ width: '20px', height: '20px', cursor: (role === 'HR' || role === 'MD') ? 'pointer' : 'not-allowed', marginTop: '3px' }}
                  />
                  <div>
                    <label style={{ fontWeight: 700, color: 'var(--primary-color)', cursor: (role === 'HR' || role === 'MD') ? 'pointer' : 'not-allowed' }}>
                      Enable Sandwich Leave Policy
                    </label>
                    <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '4px', lineHeight: '1.5' }}>
                      When ON, Weekly Offs (Sundays) and holidays sandwiched between two consecutive Absent / Unpaid-Leave days will be automatically converted to Absent (Loss of Pay) when executing monthly payroll checks.
                    </p>
                  </div>
                </div>
              </div>
              
              {role !== 'HR' && role !== 'MD' && (
                <div style={{ marginTop: '15px', color: 'var(--danger)', fontSize: '12.5px', fontWeight: 600 }}>
                  * Only HR administrators or MD users can modify company policies.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
