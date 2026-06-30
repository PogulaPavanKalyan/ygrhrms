import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Invoices = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'create'

  // Invoice builder state (HR/MD only)
  const [selectedClient, setSelectedClient] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [gstPercent, setGstPercent] = useState('18');
  const [invoiceNote, setInvoiceNote] = useState('');
  const [selectedItems, setSelectedItems] = useState([{ service: '', amount: '', discount_percent: '0' }]);
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal state
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState(null);

  const loadInvoiceData = async () => {
    setLoading(true);
    try {
      const invoicesRes = await api.get('/api/invoices/');
      setInvoices(invoicesRes.data || []);

      const resourceRes = await api.get('/api/invoicing-resources/');
      setClients(resourceRes.data.clients || []);
      setServices(resourceRes.data.services || []);
    } catch (err) {
      console.error('Error loading invoicing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoiceData();
  }, []);

  const handleAddField = () => {
    setSelectedItems([...selectedItems, { service: '', amount: '', discount_percent: '0' }]);
  };

  const handleRemoveField = (index) => {
    const values = [...selectedItems];
    values.splice(index, 1);
    setSelectedItems(values);
  };

  const handleItemChange = (index, field, value) => {
    const values = [...selectedItems];
    values[index][field] = value;
    
    // Auto populate service amount if service changes
    if (field === 'service') {
      const s = services.find(x => x.id === Number(value));
      if (s) {
        values[index]['amount'] = s.amount;
      }
    }
    setSelectedItems(values);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Validate items
      const validItems = selectedItems.filter(item => item.service !== '');
      if (validItems.length === 0) {
        alert('Please add at least one valid service item.');
        setSubmitting(false);
        return;
      }

      await api.post('/api/invoices/', {
        client: selectedClient,
        discount_percent: discountPercent,
        gst_percent: gstPercent,
        note: invoiceNote,
        items: validItems,
      });

      alert('Invoice generated successfully.');
      setSelectedClient('');
      setDiscountPercent('0');
      setGstPercent('18');
      setInvoiceNote('');
      setSelectedItems([{ service: '', amount: '', discount_percent: '0' }]);
      setActiveTab('list');
      loadInvoiceData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to generate invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await api.delete(`/api/invoices/${id}/`);
      alert('Invoice deleted.');
      loadInvoiceData();
    } catch (err) {
      alert('Failed to delete invoice.');
    }
  };

  return (
    <div>
      <style>{`
        .invoice-tabs {
          display: flex;
          gap: 10px;
          border-bottom: 2px solid var(--border);
          margin-bottom: 20px;
        }
        .invoice-tab {
          padding: 10px 20px;
          cursor: pointer;
          font-weight: 700;
          color: var(--muted);
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: var(--transition-base);
        }
        .invoice-tab.active {
          color: var(--accent-blue);
          border-bottom-color: var(--accent-blue);
        }
        .invoice-item-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          gap: 15px;
          align-items: center;
          margin-bottom: 12px;
        }
        @media (max-width: 600px) {
          .invoice-item-row {
            grid-template-columns: 1fr;
            gap: 10px;
            border-bottom: 1px dashed var(--border);
            padding-bottom: 15px;
          }
        }
      `}</style>

      <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Invoicing Portal</h2>

      {/* Tabs */}
      {['HR', 'MD'].includes(role) && (
        <div className="invoice-tabs">
          <div className={`invoice-tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
            📋 Invoice Registry
          </div>
          <div className={`invoice-tab ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
            ✍️ Compile Invoice
          </div>
        </div>
      )}

      {loading ? (
        <div>Loading invoicing records...</div>
      ) : (
        <div>
          {/* 1. LIST VIEW */}
          {activeTab === 'list' && (
            <div className="dashboard-panel-card">
              <div className="panel-header">
                <h2>Generated Client Invoices</h2>
              </div>
              <div className="panel-body">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Client</th>
                        <th>Subtotal</th>
                        <th>GST Amount</th>
                        <th>Grand Total</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.length > 0 ? (
                        invoices.map((inv) => (
                          <tr key={inv.id}>
                            <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{inv.invoice_number}</td>
                            <td style={{ fontWeight: 600 }}>{inv.client_name}</td>
                            <td>₹{parseFloat(inv.subtotal || 0).toFixed(2)}</td>
                            <td>₹{parseFloat(inv.gst || 0).toFixed(2)} ({inv.gst_percent}%)</td>
                            <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{parseFloat(inv.grand_total || 0).toFixed(2)}</td>
                            <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="view-btn" onClick={() => setSelectedInvoiceDetail(inv)}>
                                  👁 Details
                                </button>
                                {['HR', 'MD'].includes(role) && (
                                  <button className="view-btn" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }} onClick={() => handleDelete(inv.id)}>
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--muted)' }}>No invoices found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. CREATE INVOICE VIEW */}
          {activeTab === 'create' && (
            <div className="dashboard-panel-card">
              <div className="panel-header">
                <h2>Compile New Client Invoice</h2>
              </div>
              <div className="panel-body">
                <form onSubmit={handleCreateSubmit} style={{ textAlign: 'left' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label>Client profile</label>
                      <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        <option value="">Choose Client...</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.business_name})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Discount Percentage (%)</label>
                      <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} min="0" max="100" />
                    </div>
                    <div className="form-group">
                      <label>GST Rate (%)</label>
                      <input type="number" value={gstPercent} onChange={(e) => setGstPercent(e.target.value)} min="0" />
                    </div>
                  </div>

                  <h4 style={{ margin: '20px 0 10px 0', borderBottom: '1px solid var(--border)', paddingBottom: '6px', color: 'var(--primary-color)' }}>Line Items Settings</h4>
                  {selectedItems.map((item, idx) => (
                    <div className="invoice-item-row" key={idx}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <select value={item.service} onChange={(e) => handleItemChange(idx, 'service', e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                          <option value="">Choose Service...</option>
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>{s.name} (Base: ₹{s.amount})</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <input type="number" value={item.amount} onChange={(e) => handleItemChange(idx, 'amount', e.target.value)} placeholder="Price Override" required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <input type="number" value={item.discount_percent} onChange={(e) => handleItemChange(idx, 'discount_percent', e.target.value)} placeholder="Disc %" />
                      </div>
                      <button type="button" className="view-btn" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px' }} onClick={() => handleRemoveField(idx)}>
                        Remove
                      </button>
                    </div>
                  ))}
                  
                  <button type="button" className="download-btn" style={{ marginBottom: '20px' }} onClick={handleAddField}>
                    + Add Item Row
                  </button>

                  <div className="form-group">
                    <label>Additional Notes / Bank Info</label>
                    <textarea rows="3" value={invoiceNote} onChange={(e) => setInvoiceNote(e.target.value)} placeholder="Terms of payment details..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                  </div>

                  <button type="submit" className="btn" disabled={submitting} style={{ width: '100%' }}>
                    {submitting ? 'Compiling Invoice...' : 'Generate Client Invoice'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedInvoiceDetail && (
        <div className="modal-overlay" onClick={() => setSelectedInvoiceDetail(null)}>
          <div className="modal-container" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Invoice Summary ( #{selectedInvoiceDetail.invoice_number} )</h3>
              <button className="modal-close" onClick={() => setSelectedInvoiceDetail(null)}>×</button>
            </div>
            
            <div style={{ textAlign: 'left', marginBottom: '20px', fontSize: '13px' }}>
              <p><b>Client:</b> {selectedInvoiceDetail.client_name}</p>
              {selectedInvoiceDetail.client_business_name && <p><b>Company:</b> {selectedInvoiceDetail.client_business_name}</p>}
              <p><b>Date Generated:</b> {new Date(selectedInvoiceDetail.created_at).toLocaleDateString()}</p>
            </div>

            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--accent-blue)', marginBottom: '8px' }}>Line Items</h4>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {selectedInvoiceDetail.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0', fontSize: '12.5px' }}>
                    <span>{item.service_name} (Disc: {item.discount_percent}%)</span>
                    <strong>₹{parseFloat(item.amount || 0).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '4px 0' }}>
                <span>Subtotal</span><span>₹{parseFloat(selectedInvoiceDetail.subtotal || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '4px 0' }}>
                <span>Discount ({selectedInvoiceDetail.discount_percent}%)</span><span>- ₹{parseFloat(selectedInvoiceDetail.discount_amount || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '4px 0' }}>
                <span>GST ({selectedInvoiceDetail.gst_percent}%)</span><span>₹{parseFloat(selectedInvoiceDetail.gst || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '800', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '8px', color: 'var(--success)' }}>
                <span>Grand Total</span><span>₹{parseFloat(selectedInvoiceDetail.grand_total || 0).toFixed(2)}</span>
              </div>
            </div>

            {selectedInvoiceDetail.note && (
              <div style={{ textAlign: 'left', marginTop: '15px', fontSize: '12px', color: 'var(--muted)', background: '#fff', border: '1px solid var(--border)', padding: '10px', borderRadius: '6px' }}>
                <b>Notes:</b> {selectedInvoiceDetail.note}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
