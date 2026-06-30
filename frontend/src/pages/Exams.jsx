import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Exams = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [activeTab, setActiveTab] = useState('scores'); // 'scores' or 'questions' or 'take-exam'
  const [results, setResults] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Question Form state
  const [newLanguage, setNewLanguage] = useState('python');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState('A');
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Candidate Exam flow state
  const [candEmail, setCandEmail] = useState('');
  const [candPassword, setCandPassword] = useState('');
  const [examStarted, setExamStarted] = useState(false);
  const [examQuestions, setExamQuestions] = useState([]);
  const [candidateAnswers, setCandidateAnswers] = useState({});
  const [examResultInfo, setExamResultInfo] = useState(null);
  const [submittingExam, setSubmittingExam] = useState(false);

  const loadExamData = async () => {
    setLoading(true);
    try {
      const resultsRes = await api.get('/api/exams/');
      setResults(resultsRes.data || []);

      const questionsRes = await api.get('/api/questions/');
      setQuestions(questionsRes.data || []);
    } catch (err) {
      console.error('Error loading exam module data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamData();
  }, []);

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    setSavingQuestion(true);
    try {
      await api.post('/api/questions/', {
        language: newLanguage,
        question_text: newQuestionText,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        correct_option: correctOpt,
      });
      alert('Question added to exam pool.');
      setNewQuestionText('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      loadExamData();
    } catch (err) {
      alert('Failed to save question.');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleStartCandidateExam = async (e) => {
    e.preventDefault();
    try {
      // First, check candidate profile & questions matching their candidate role/language
      const res = await api.get('/api/questions/', {
        params: { language: newLanguage }
      });
      if (res.data.length === 0) {
        alert('No questions configured in database for this language module.');
        return;
      }
      setExamQuestions(res.data);
      setExamStarted(true);
    } catch (err) {
      alert('Could not start candidate exam.');
    }
  };

  const handleSelectOption = (questionId, option) => {
    setCandidateAnswers({
      ...candidateAnswers,
      [questionId]: option
    });
  };

  const handleSubmitExam = async () => {
    if (!window.confirm('Are you sure you want to finalize and submit your exam responses?')) return;
    setSubmittingExam(true);
    try {
      const res = await api.post('/api/exams/', {
        email: candEmail,
        password: candPassword,
        answers: candidateAnswers,
      });
      setExamResultInfo(res.data);
      alert('Exam submitted successfully.');
      loadExamData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit candidate answers.');
    } finally {
      setSubmittingExam(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to remove this question?')) return;
    try {
      await api.delete(`/api/questions/${id}/`);
      alert('Question deleted.');
      loadExamData();
    } catch (err) {
      alert('Failed to delete question.');
    }
  };

  return (
    <div>
      <style>{`
        .exam-tabs {
          display: flex;
          gap: 10px;
          border-bottom: 2px solid var(--border);
          margin-bottom: 20px;
        }
        .exam-tab {
          padding: 10px 20px;
          cursor: pointer;
          font-weight: 700;
          color: var(--muted);
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: var(--transition-base);
        }
        .exam-tab.active {
          color: var(--accent-blue);
          border-bottom-color: var(--accent-blue);
        }
        .exam-question-card {
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 15px;
          text-align: left;
        }
        .exam-option-btn {
          display: block;
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          background: #ffffff;
          border: 1px solid var(--border);
          border-radius: 6px;
          margin-top: 8px;
          cursor: pointer;
          font-size: 13px;
          transition: var(--transition-base);
        }
        .exam-option-btn.active {
          background: rgba(37, 99, 235, 0.1);
          border-color: var(--accent-blue);
          color: #2563eb;
          font-weight: 700;
        }
      `}</style>

      <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Exams & Evaluations Portal</h2>

      {/* Tabs */}
      <div className="exam-tabs">
        <div className={`exam-tab ${activeTab === 'scores' ? 'active' : ''}`} onClick={() => { setActiveTab('scores'); setExamResultInfo(null); setExamStarted(false); }}>
          📋 Candidate Score Log
        </div>
        {['HR', 'MD'].includes(role) && (
          <div className={`exam-tab ${activeTab === 'questions' ? 'active' : ''}`} onClick={() => { setActiveTab('questions'); setExamResultInfo(null); setExamStarted(false); }}>
            ❓ Question Bank Pool
          </div>
        )}
        <div className={`exam-tab ${activeTab === 'take-exam' ? 'active' : ''}`} onClick={() => { setActiveTab('take-exam'); setExamResultInfo(null); setExamStarted(false); }}>
          ✍️ Candidate Test Gateway
        </div>
      </div>

      {loading ? (
        <div>Loading exam registry records...</div>
      ) : (
        <div>
          {/* 1. CANDIDATE SCORES VIEW */}
          {activeTab === 'scores' && (
            <div className="dashboard-panel-card">
              <div className="panel-header">
                <h2>Completed Exam Sessions</h2>
              </div>
              <div className="panel-body">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Candidate Profile</th>
                        <th>Language taken</th>
                        <th>Assigned score</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.length > 0 ? (
                        results.map((r) => (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 600 }}>{r.exam_user_name}</td>
                            <td><span className="badge-capsule info">{r.exam_language.toUpperCase()}</span></td>
                            <td style={{ fontWeight: 700, color: r.score >= 60 ? 'var(--success)' : 'var(--danger)' }}>{r.score.toFixed(1)}%</td>
                            <td>
                              <span className={`badge-capsule ${r.score >= 60 ? 'success' : 'danger'}`}>
                                {r.score >= 60 ? 'Passed' : 'Failed'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: 'var(--muted)' }}>No completed evaluations yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. QUESTION BANK VIEW (HR ONLY) */}
          {activeTab === 'questions' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '20px' }}>
              <div className="dashboard-panel-card" style={{ textAlign: 'left' }}>
                <div className="panel-header">
                  <h2>Exam Questions Feed</h2>
                </div>
                <div className="panel-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {questions.length > 0 ? (
                    questions.map((q) => (
                      <div className="exam-question-card" key={q.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span className="badge-capsule info" style={{ marginBottom: '8px' }}>{q.language.toUpperCase()}</span>
                          <button className="view-btn" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }} onClick={() => handleDeleteQuestion(q.id)}>
                            Delete
                          </button>
                        </div>
                        <p style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{q.question_text}</p>
                        <div style={{ fontSize: '12.5px', marginTop: '6px', color: 'var(--text-secondary)' }}>
                          <div>A. {q.option_a}</div>
                          <div>B. {q.option_b}</div>
                          <div>C. {q.option_c}</div>
                          <div>D. {q.option_d}</div>
                          <div style={{ color: 'var(--success)', fontWeight: '700', marginTop: '4px' }}>Correct Option: {q.correct_option}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--muted)' }}>No questions configured in database.</p>
                  )}
                </div>
              </div>

              <div className="dashboard-panel-card" style={{ height: 'fit-content' }}>
                <div className="panel-header">
                  <h2>Create Question</h2>
                </div>
                <div className="panel-body">
                  <form onSubmit={handleCreateQuestion} style={{ textAlign: 'left' }}>
                    <div className="form-group">
                      <label>Language Module</label>
                      <select value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        <option value="python">Python</option>
                        <option value="django">Django</option>
                        <option value="react">React.js</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Question Description</label>
                      <textarea rows="3" value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} required placeholder="Provide query question description..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                    </div>
                    <div className="form-group"><label>Option A</label><input type="text" value={optA} onChange={(e) => setOptA(e.target.value)} required /></div>
                    <div className="form-group"><label>Option B</label><input type="text" value={optB} onChange={(e) => setOptB(e.target.value)} required /></div>
                    <div className="form-group"><label>Option C</label><input type="text" value={optC} onChange={(e) => setOptC(e.target.value)} required /></div>
                    <div className="form-group"><label>Option D</label><input type="text" value={optD} onChange={(e) => setOptD(e.target.value)} required /></div>
                    <div className="form-group">
                      <label>Correct Choice</label>
                      <select value={correctOpt} onChange={(e) => setCorrectOpt(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>
                    <button type="submit" className="btn" disabled={savingQuestion} style={{ width: '100%' }}>
                      {savingQuestion ? 'Saving question...' : 'Add to Question Bank'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* 3. TAKE TEST VIEW */}
          {activeTab === 'take-exam' && (
            <div className="dashboard-panel-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div className="panel-header">
                <h2>Evaluation Test Sheet</h2>
              </div>
              <div className="panel-body">
                {examResultInfo ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h3 style={{ color: 'var(--success)' }}>Test Evaluated!</h3>
                    <p style={{ fontSize: '18px', margin: '15px 0' }}>Your score details: <b>{examResultInfo.score.toFixed(1)}%</b></p>
                    <p style={{ color: 'var(--muted)' }}>Correct answers: {examResultInfo.correct_answers} out of {examResultInfo.total_questions}</p>
                    <button className="btn" style={{ marginTop: '20px' }} onClick={() => setExamResultInfo(null)}>
                      Finish review
                    </button>
                  </div>
                ) : examStarted ? (
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                      <span>Candidate email: <b>{candEmail}</b></span>
                      <span>Module language: <b>{newLanguage.toUpperCase()}</b></span>
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                      {examQuestions.map((q, idx) => (
                        <div className="exam-question-card" key={q.id}>
                          <p style={{ fontWeight: 700 }}>{idx + 1}. {q.question_text}</p>
                          <button type="button" className={`exam-option-btn ${candidateAnswers[q.id] === 'A' ? 'active' : ''}`} onClick={() => handleSelectOption(q.id, 'A')}>A. {q.option_a}</button>
                          <button type="button" className={`exam-option-btn ${candidateAnswers[q.id] === 'B' ? 'active' : ''}`} onClick={() => handleSelectOption(q.id, 'B')}>B. {q.option_b}</button>
                          <button type="button" className={`exam-option-btn ${candidateAnswers[q.id] === 'C' ? 'active' : ''}`} onClick={() => handleSelectOption(q.id, 'C')}>C. {q.option_c}</button>
                          <button type="button" className={`exam-option-btn ${candidateAnswers[q.id] === 'D' ? 'active' : ''}`} onClick={() => handleSelectOption(q.id, 'D')}>D. {q.option_d}</button>
                        </div>
                      ))}
                    </div>

                    <button className="btn" disabled={submittingExam} style={{ width: '100%', marginTop: '20px' }} onClick={handleSubmitExam}>
                      {submittingExam ? 'Evaluating responses...' : 'Submit Evaluation responses'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleStartCandidateExam} style={{ textAlign: 'left' }}>
                    <div className="form-group">
                      <label>Candidate Email</label>
                      <input type="email" value={candEmail} onChange={(e) => setCandEmail(e.target.value)} required placeholder="e.g. candidate@domain.com" />
                    </div>
                    <div className="form-group">
                      <label>Candidate Access Code / Password</label>
                      <input type="password" value={candPassword} onChange={(e) => setCandPassword(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Select Test Language</label>
                      <select value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        <option value="python">Python</option>
                        <option value="django">Django</option>
                        <option value="react">React.js</option>
                      </select>
                    </div>
                    <button type="submit" className="btn" style={{ width: '100%', marginTop: '10px' }}>
                      Authenticate and Start Test
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Exams;
