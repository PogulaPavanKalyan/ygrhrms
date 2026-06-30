import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Register = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [doj, setDoj] = useState('');
  const [empStatus, setEmpStatus] = useState('Fresher');
  const [salary, setSalary] = useState('');
  const [department, setDepartment] = useState('');
  const [teamName, setTeamName] = useState('');
  const [expYears, setExpYears] = useState('');
  const [prevCompany, setPrevCompany] = useState('');
  const [address, setAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState('Employee');
  const [profilePic, setProfilePic] = useState(null);
  const [document, setDocument] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('fullname', fullname);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('password', password);
      formData.append('confirm_password', confirmPassword);
      formData.append('gender', gender);
      formData.append('date_of_birth', dob);
      formData.append('date_of_joining', doj);
      formData.append('status', empStatus);
      formData.append('salary', salary);
      formData.append('department', department);
      formData.append('team_name', teamName);
      formData.append('experience_years', expYears);
      formData.append('previous_company', prevCompany);
      formData.append('address', address);
      formData.append('role', selectedRole);

      if (profilePic) {
        formData.append('profile_pic', profilePic);
      }
      if (document) {
        formData.append('document', document);
      }

      await api.post('/api/register/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert(`${selectedRole} registered successfully!`);
      // Reset form
      setFullname('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      setDob('');
      setDoj('');
      setSalary('');
      setDepartment('');
      setTeamName('');
      setExpYears('');
      setPrevCompany('');
      setAddress('');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to register account.');
    } finally {
      setSubmitting(false);
    }
  };

  if (role !== 'HR' && role !== 'MD') {
    return <div style={{ color: 'var(--danger)', fontWeight: 700, padding: '20px' }}>Access Denied: Only HR or MD can access registration page.</div>;
  }

  return (
    <div>
      <style>{`
        .register-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 15px;
          margin-bottom: 15px;
        }
      `}</style>
      <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Account Registration</h2>

      <div className="dashboard-panel-card" style={{ maxWidth: '750px', margin: '0 auto' }}>
        <div className="panel-header">
          <h2>Create Staff Account</h2>
        </div>
        <div className="panel-body">
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <div className="register-grid">
              <div className="form-group">
                <label>Account Role Category</label>
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <option value="Employee">Employee</option>
                  <option value="TeamLead">Team Lead</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={fullname} onChange={(e) => setFullname(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Email Address (Username)</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="register-grid">
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="register-grid">
              <div className="form-group">
                <label>Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Date of Joining</label>
                <input type="date" value={doj} onChange={(e) => setDoj(e.target.value)} />
              </div>
            </div>

            <div className="register-grid">
              <div className="form-group">
                <label>Experience (Years)</label>
                <input type="number" value={expYears} onChange={(e) => setExpYears(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Previous Company Name</label>
                <input type="text" value={prevCompany} onChange={(e) => setPrevCompany(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Salary (LPA / Monthly)</label>
                <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} />
              </div>
            </div>

            <div className="register-grid">
              <div className="form-group">
                <label>Department</label>
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. technology" />
              </div>
              <div className="form-group">
                <label>Team Scope</label>
                <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. alpha-team" />
              </div>
              <div className="form-group">
                <label>Employment Status</label>
                <select value={empStatus} onChange={(e) => setEmpStatus(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <option value="Fresher">Fresher</option>
                  <option value="Experienced">Experienced</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Home Address</label>
              <textarea rows="2" value={address} onChange={(e) => setAddress(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div className="form-group">
                <label>Profile Image File</label>
                <input type="file" onChange={(e) => setProfilePic(e.target.files[0])} style={{ padding: '6px 0' }} />
              </div>
              <div className="form-group">
                <label>Contract Documents (PDF)</label>
                <input type="file" onChange={(e) => setDocument(e.target.files[0])} style={{ padding: '6px 0' }} />
              </div>
            </div>

            <button type="submit" className="btn" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Registering Account...' : 'Register Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
