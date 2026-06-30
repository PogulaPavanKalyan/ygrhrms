import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Payroll = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit structure modal state
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [monthlyGross, setMonthlyGross] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [hra, setHra] = useState('');
  const [transportAllowance, setTransportAllowance] = useState('');
  const [medicalAllowance, setMedicalAllowance] = useState('');
  const [specialAllowance, setSpecialAllowance] = useState('');
  const [bonus, setBonus] = useState('');
  const [pfEnabled, setPfEnabled] = useState(true);
  const [pfRate, setPfRate] = useState('12.00');
  const [pfAmount, setPfAmount] = useState('0');
  const [esiEnabled, setEsiEnabled] = useState(true);
  const [esiRate, setEsiRate] = useState('0.75');
  const [esiAmount, setEsiAmount] = useState('0');
  const [ptEnabled, setPtEnabled] = useState(true);
  const [ptAmount, setPtAmount] = useState('200');
  const [tdsAmount, setTdsAmount] = useState('0');
  const [otherDeductions, setOtherDeductions] = useState('0');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [pan, setPan] = useState('');
  const [uan, setUan] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [saving, setSaving] = useState(false);

  const loadStructures = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/salary-structures/');
      setStructures(res.data);
    } catch (err) {
      console.error('Error loading salary structures:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStructures();
  }, []);

  const handleEditClick = (struct) => {
    setSelectedStructure(struct);
    setMonthlyGross(struct.monthly_gross || '');
    setBasicSalary(struct.basic_salary || '');
    setHra(struct.hra || '');
    setTransportAllowance(struct.transport_allowance || '');
    setMedicalAllowance(struct.medical_allowance || '');
    setSpecialAllowance(struct.special_allowance || '');
    setBonus(struct.bonus || '');
    setPfEnabled(struct.pf_enabled ?? true);
    setPfRate(struct.pf_rate || '12.00');
    setPfAmount(struct.pf_amount || '0');
    setEsiEnabled(struct.esi_enabled ?? true);
    setEsiRate(struct.esi_rate || '0.75');
    setEsiAmount(struct.esi_amount || '0');
    setPtEnabled(struct.pt_enabled ?? true);
    setPtAmount(struct.pt_amount || '200');
    setTdsAmount(struct.tds_amount || '0');
    setOtherDeductions(struct.other_deductions || '0');
    setBankName(struct.bank_name || '');
    setAccountNumber(struct.account_number || '');
    setIfscCode(struct.ifsc_code || '');
    setPan(struct.pan || '');
    setUan(struct.uan || '');
    setAadhaar(struct.aadhaar || '');
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/salary-structures/', {
        employee: selectedStructure.employee,
        monthly_gross: monthlyGross,
        basic_salary: basicSalary,
        hra,
        transport_allowance: transportAllowance,
        medical_allowance: medicalAllowance,
        special_allowance: specialAllowance,
        bonus,
        pf_enabled: pfEnabled,
        pf_rate: pfRate,
        pf_amount: pfAmount,
        esi_enabled: esiEnabled,
        esi_rate: esiRate,
        esi_amount: esiAmount,
        pt_enabled: ptEnabled,
        pt_amount: ptAmount,
        tds_amount: tdsAmount,
        other_deductions: otherDeductions,
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
        pan,
        uan,
        aadhaar,
      });
      alert('Salary structure updated.');
      setSelectedStructure(null);
      loadStructures();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update salary structure.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <style>{`
        .structure-modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          max-height: 480px;
          overflow-y: auto;
          padding-right: 8px;
        }
        @media (max-width: 600px) {
          .structure-modal-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Payroll Structures</h2>

      <div className="dashboard-panel-card">
        <div className="panel-header">
          <h2>Salary Configurations</h2>
        </div>
        <div className="panel-body">
          {loading ? (
            <div>Loading configurations...</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Monthly Gross</th>
                    <th>Basic Salary</th>
                    <th>PF Status</th>
                    <th>Bank Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {structures.length > 0 ? (
                    structures.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.employee_full_name} ({s.employee_name})</td>
                        <td>₹{s.monthly_gross}</td>
                        <td>₹{s.basic_salary}</td>
                        <td>
                          <span className={`badge-capsule ${s.pf_enabled ? 'success' : 'info'}`}>
                            {s.pf_enabled ? 'PF Active' : 'PF Inactive'}
                          </span>
                        </td>
                        <td>
                          {s.bank_name ? (
                            <span style={{ fontSize: '12px' }}>{s.bank_name} ({s.account_number})</span>
                          ) : (
                            <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Not Configured</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {['HR', 'MD'].includes(role) ? (
                              <button className="view-btn" onClick={() => handleEditClick(s)}>
                                ⚙️ Configure
                              </button>
                            ) : (
                              <button className="view-btn" onClick={() => alert('Salary structures are managed by HR administrators.')}>
                                View only
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--muted)' }}>No configurations found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* EDIT CONFIG MODAL */}
      {selectedStructure && (
        <div className="modal-overlay" onClick={() => setSelectedStructure(null)}>
          <div className="modal-container" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Salary Structure ( {selectedStructure.employee_full_name} )</h3>
              <button className="modal-close" onClick={() => setSelectedStructure(null)}>×</button>
            </div>
            
            <form onSubmit={handleSaveSubmit} style={{ textAlign: 'left' }}>
              <div className="structure-modal-grid">
                
                {/* Block 1: Earnings */}
                <div>
                  <h4 style={{ color: 'var(--accent-blue)', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginBottom: '12px' }}>Earnings Details</h4>
                  <div className="form-group">
                    <label>Monthly Gross</label>
                    <input type="number" value={monthlyGross} onChange={(e) => setMonthlyGross(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Basic Salary</label>
                    <input type="number" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>HRA</label>
                    <input type="number" value={hra} onChange={(e) => setHra(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Transport Allowance</label>
                    <input type="number" value={transportAllowance} onChange={(e) => setTransportAllowance(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Medical Allowance</label>
                    <input type="number" value={medicalAllowance} onChange={(e) => setMedicalAllowance(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Special Allowance</label>
                    <input type="number" value={specialAllowance} onChange={(e) => setSpecialAllowance(e.target.value)} />
                  </div>
                </div>

                {/* Block 2: Deductions & Bank */}
                <div>
                  <h4 style={{ color: 'var(--danger)', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginBottom: '12px' }}>Deductions & Statutory</h4>
                  
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={pfEnabled} onChange={(e) => setPfEnabled(e.target.checked)} />
                      PF enabled
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={esiEnabled} onChange={(e) => setEsiEnabled(e.target.checked)} />
                      ESI enabled
                    </label>
                  </div>

                  <div className="form-group">
                    <label>Bank Name</label>
                    <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Account Number</label>
                    <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>IFSC Code</label>
                    <input type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>PAN Card</label>
                    <input type="text" value={pan} onChange={(e) => setPan(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>UAN</label>
                    <input type="text" value={uan} onChange={(e) => setUan(e.target.value)} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn" style={{ background: '#64748b', marginTop: 0 }} onClick={() => setSelectedStructure(null)}>Cancel</button>
                <button type="submit" className="btn" disabled={saving} style={{ marginTop: 0 }}>
                  {saving ? 'Saving changes...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
