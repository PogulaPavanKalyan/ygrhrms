import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Payslips = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'create'

  // Filter state (for admin/managers)
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Manual Creation state (HR/MD only)
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [basicSalary, setBasicSalary] = useState('');
  const [hra, setHra] = useState('');
  const [transportAllowance, setTransportAllowance] = useState('');
  const [medicalAllowance, setMedicalAllowance] = useState('');
  const [specialAllowance, setSpecialAllowance] = useState('');
  const [bonus, setBonus] = useState('');
  const [pfDeduction, setPfDeduction] = useState('');
  const [esiDeduction, setEsiDeduction] = useState('');
  const [profTax, setProfTax] = useState('');
  const [tds, setTds] = useState('');
  const [loanDeduction, setLoanDeduction] = useState('');
  const [otherDeductions, setOtherDeductions] = useState('');
  const [workingDays, setWorkingDays] = useState('26');
  const [daysPresent, setDaysPresent] = useState('26');
  const [daysAbsent, setDaysAbsent] = useState('0');
  const [leavesTaken, setLeavesTaken] = useState('0');
  const [payslipStatus, setPayslipStatus] = useState('Paid');
  const [isPublished, setIsPublished] = useState(true);
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal state
  const [selectedSlipDetail, setSelectedSlipDetail] = useState(null);

  const loadPayslips = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (monthFilter) params.month = monthFilter;
      if (yearFilter) params.year = yearFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/api/payslips/', { params });
      setPayslips(res.data);
    } catch (err) {
      console.error('Error loading payslips:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await api.get('/api/dashboard/hr/'); // we can get users here or list them
      // let's fetch members from auth context or similar, or HR dashboard API returns user alignment
      // Let's use MD dashboard endpoint to get all_users directory
      const mdRes = await api.get('/api/dashboard/md/');
      setEmployees(mdRes.data.all_users || []);
    } catch (err) {
      console.error('Error loading employees list:', err);
    }
  };

  useEffect(() => {
    loadPayslips();
    if (['HR', 'MD'].includes(role)) {
      loadEmployees();
    }
  }, [search, monthFilter, yearFilter, statusFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/payslips/', {
        employee: selectedEmp,
        month,
        year,
        basic_salary: basicSalary,
        hra,
        transport_allowance: transportAllowance,
        medical_allowance: medicalAllowance,
        special_allowance: specialAllowance,
        bonus,
        pf_deduction: pfDeduction,
        esi_deduction: esiDeduction,
        professional_tax: profTax,
        tds,
        loan_deduction: loanDeduction,
        other_deductions: otherDeductions,
        working_days: workingDays,
        days_present: daysPresent,
        days_absent: daysAbsent,
        leaves_taken: leavesTaken,
        status: payslipStatus,
        is_published: isPublished,
        payment_date: paymentDate,
        notes,
      });
      alert('Payslip generated and published successfully.');
      setActiveTab('list');
      loadPayslips();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to generate payslip.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payslip record?')) return;
    try {
      await api.delete(`/api/payslips/${id}/`);
      alert('Payslip deleted.');
      loadPayslips();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete payslip.');
    }
  };

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
        .payslip-tabs {
          display: flex;
          gap: 10px;
          border-bottom: 2px solid var(--border);
          margin-bottom: 20px;
        }
        .payslip-tab {
          padding: 10px 20px;
          cursor: pointer;
          font-weight: 700;
          color: var(--muted);
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: var(--transition-base);
        }
        .payslip-tab.active {
          color: var(--accent-blue);
          border-bottom-color: var(--accent-blue);
        }
        
        .create-payslip-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .slip-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        @media (max-width: 600px) {
          .slip-detail-grid {
            grid-template-columns: 1fr;
          }
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
          padding: 6px 0;
          font-size: 13px;
        }
      `}</style>

      <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Salary Registry</h2>

      {/* Tabs */}
      {['HR', 'MD'].includes(role) && (
        <div className="payslip-tabs">
          <div className={`payslip-tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
            📋 Payslips Registry
          </div>
          <div className={`payslip-tab ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
            ✍️ Manual Payslip Generation
          </div>
        </div>
      )}

      {/* 1. LIST VIEW */}
      {activeTab === 'list' && (
        <div className="dashboard-panel-card">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h2>Published Slips</h2>
            {role !== 'Employee' && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search staff name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                />
                <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}>
                  <option value="">Month</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}>
                  <option value="">Year</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            )}
          </div>
          <div className="panel-body">
            {loading ? (
              <div>Loading salary records...</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Period</th>
                      <th>Gross earnings</th>
                      <th>Deductions</th>
                      <th>Net Salary</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.length > 0 ? (
                      payslips.map((p) => {
                        const gross = parseFloat(p.basic_salary || 0) + parseFloat(p.hra || 0) + parseFloat(p.transport_allowance || 0) + parseFloat(p.medical_allowance || 0) + parseFloat(p.special_allowance || 0) + parseFloat(p.bonus || 0);
                        const ded = parseFloat(p.pf_deduction || 0) + parseFloat(p.esi_deduction || 0) + parseFloat(p.professional_tax || 0) + parseFloat(p.tds || 0) + parseFloat(p.loan_deduction || 0) + parseFloat(p.other_deductions || 0);
                        return (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600 }}>{p.employee_name} ({p.designation})</td>
                            <td>{p.month_name} {p.year}</td>
                            <td>₹{gross.toFixed(2)}</td>
                            <td>₹{ded.toFixed(2)}</td>
                            <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{p.net_salary}</td>
                            <td>
                              <span className={`badge-capsule ${p.status === 'Paid' ? 'success' : 'warning'}`}>
                                {p.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="view-btn" onClick={() => setSelectedSlipDetail(p)}>
                                  👁 Details
                                </button>
                                {p.payslip_pdf && (
                                  <a href={p.payslip_pdf.startsWith('http') ? p.payslip_pdf : `${(import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')}${p.payslip_pdf}`} download className="download-btn">
                                    ⬇ PDF
                                  </a>
                                )}
                                {['HR', 'MD'].includes(role) && (
                                  <button className="view-btn" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }} onClick={() => handleDelete(p.id)}>
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: 'var(--muted)' }}>No payslips found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MANUAL GENERATE FORM */}
      {activeTab === 'create' && (
        <div className="dashboard-panel-card">
          <div className="panel-header">
            <h2>Generate Salary Record</h2>
          </div>
          <div className="panel-body">
            <form onSubmit={handleCreateSubmit} style={{ textAlign: 'left' }}>
              <div className="create-payslip-grid">
                <div className="form-group">
                  <label>Employee Selection</label>
                  <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <option value="">Select Staff...</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Month</label>
                  <select value={month} onChange={(e) => setMonth(Number(e.target.value))} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <select value={year} onChange={(e) => setYear(Number(e.target.value))} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>

              <h4 style={{ margin: '20px 0 10px 0', borderBottom: '1px solid var(--border)', paddingBottom: '6px', color: 'var(--primary-color)' }}>Earnings Settings</h4>
              <div className="create-payslip-grid">
                <div className="form-group">
                  <label>Basic Salary</label>
                  <input type="number" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} placeholder="0.00" required />
                </div>
                <div className="form-group">
                  <label>HRA</label>
                  <input type="number" value={hra} onChange={(e) => setHra(e.target.value)} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Transport Allowance</label>
                  <input type="number" value={transportAllowance} onChange={(e) => setTransportAllowance(e.target.value)} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Medical Allowance</label>
                  <input type="number" value={medicalAllowance} onChange={(e) => setMedicalAllowance(e.target.value)} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Special Allowance</label>
                  <input type="number" value={specialAllowance} onChange={(e) => setSpecialAllowance(e.target.value)} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Bonus</label>
                  <input type="number" value={bonus} onChange={(e) => setBonus(e.target.value)} placeholder="0.00" />
                </div>
              </div>

              <h4 style={{ margin: '20px 0 10px 0', borderBottom: '1px solid var(--border)', paddingBottom: '6px', color: 'var(--primary-color)' }}>Deductions Settings</h4>
              <div className="create-payslip-grid">
                <div className="form-group">
                  <label>PF Deduction</label>
                  <input type="number" value={pfDeduction} onChange={(e) => setPfDeduction(e.target.value)} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>ESI Deduction</label>
                  <input type="number" value={esiDeduction} onChange={(e) => setEsiDeduction(e.target.value)} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Professional Tax</label>
                  <input type="number" value={profTax} onChange={(e) => setProfTax(e.target.value)} placeholder="200.00" />
                </div>
                <div className="form-group">
                  <label>TDS</label>
                  <input type="number" value={tds} onChange={(e) => setTds(e.target.value)} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Loan Deductions</label>
                  <input type="number" value={loanDeduction} onChange={(e) => setLoanDeduction(e.target.value)} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Other Deductions</label>
                  <input type="number" value={otherDeductions} onChange={(e) => setOtherDeductions(e.target.value)} placeholder="0.00" />
                </div>
              </div>

              <h4 style={{ margin: '20px 0 10px 0', borderBottom: '1px solid var(--border)', paddingBottom: '6px', color: 'var(--primary-color)' }}>Attendance Summary</h4>
              <div className="create-payslip-grid">
                <div className="form-group">
                  <label>Working Days</label>
                  <input type="number" value={workingDays} onChange={(e) => setWorkingDays(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Days Present</label>
                  <input type="number" value={daysPresent} onChange={(e) => setDaysPresent(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Days Absent</label>
                  <input type="number" value={daysAbsent} onChange={(e) => setDaysAbsent(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Leaves Taken</label>
                  <input type="number" value={leavesTaken} onChange={(e) => setLeavesTaken(e.target.value)} required />
                </div>
              </div>

              <h4 style={{ margin: '20px 0 10px 0', borderBottom: '1px solid var(--border)', paddingBottom: '6px', color: 'var(--primary-color)' }}>Meta details</h4>
              <div className="create-payslip-grid">
                <div className="form-group">
                  <label>Status</label>
                  <select value={payslipStatus} onChange={(e) => setPayslipStatus(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <option value="Paid">Paid</option>
                    <option value="Pending Approval">Pending Approval</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Date</label>
                  <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '30px' }}>
                    <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} style={{ width: 'auto' }} />
                    Publish Payslip immediately
                  </label>
                </div>
              </div>

              <button type="submit" className="btn" disabled={submitting} style={{ width: '100%', marginTop: '20px' }}>
                {submitting ? 'Generating Record...' : 'Generate Record'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedSlipDetail && (
        <div className="modal-overlay" onClick={() => setSelectedSlipDetail(null)}>
          <div className="modal-container" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Salary Slip Summary ({selectedSlipDetail.month_name} {selectedSlipDetail.year})</h3>
              <button className="modal-close" onClick={() => setSelectedSlipDetail(null)}>×</button>
            </div>
            
            <div className="slip-detail-grid">
              <div>
                <h4 style={{ color: 'var(--accent-blue)', marginBottom: '8px' }}>Earnings Details</h4>
                <div className="detail-row"><span>Basic Salary</span><strong>₹{selectedSlipDetail.basic_salary}</strong></div>
                <div className="detail-row"><span>HRA</span><strong>₹{selectedSlipDetail.hra || '0.00'}</strong></div>
                <div className="detail-row"><span>Transport Allowance</span><strong>₹{selectedSlipDetail.transport_allowance || '0.00'}</strong></div>
                <div className="detail-row"><span>Medical Allowance</span><strong>₹{selectedSlipDetail.medical_allowance || '0.00'}</strong></div>
                <div className="detail-row"><span>Special Allowance</span><strong>₹{selectedSlipDetail.special_allowance || '0.00'}</strong></div>
                <div className="detail-row"><span>Bonus</span><strong>₹{selectedSlipDetail.bonus || '0.00'}</strong></div>
              </div>
              
              <div>
                <h4 style={{ color: 'var(--danger)', marginBottom: '8px' }}>Deductions Details</h4>
                <div className="detail-row"><span>PF Deduction</span><strong>₹{selectedSlipDetail.pf_deduction || '0.00'}</strong></div>
                <div className="detail-row"><span>ESI Deduction</span><strong>₹{selectedSlipDetail.esi_deduction || '0.00'}</strong></div>
                <div className="detail-row"><span>Professional Tax</span><strong>₹{selectedSlipDetail.professional_tax || '0.00'}</strong></div>
                <div className="detail-row"><span>TDS</span><strong>₹{selectedSlipDetail.tds || '0.00'}</strong></div>
                <div className="detail-row"><span>Loan Deduction</span><strong>₹{selectedSlipDetail.loan_deduction || '0.00'}</strong></div>
                <div className="detail-row"><span>Other Deductions</span><strong>₹{selectedSlipDetail.other_deductions || '0.00'}</strong></div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>NET SALARY PAYABLE</span>
                <div style={{ fontSize: '1.25rem', color: 'var(--success)', fontWeight: '800' }}>₹{selectedSlipDetail.net_salary}</div>
              </div>
              {selectedSlipDetail.payslip_pdf && (
                <a href={`http://127.0.0.1:8000${selectedSlipDetail.payslip_pdf}`} download className="btn" style={{ marginTop: 0 }}>
                  Download PDF Slip
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payslips;
