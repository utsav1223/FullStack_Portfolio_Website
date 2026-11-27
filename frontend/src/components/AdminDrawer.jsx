import { useEffect, useState } from 'react';
import { X, Plus, Trash2, Save, Upload, Lock, LogOut, Eye, EyeOff, KeyRound } from 'lucide-react';

const TOKEN_STORAGE_KEY = 'portfolio_admin_token';

const TABS = [
  { id: 'header', label: 'Header & Links' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'security', label: 'Password' },
];

const splitLines = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const splitComma = (text) =>
  text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function AdminDrawer({ open, portfolio, onClose, onSaved }) {
  const [draft, setDraft] = useState(null);
  const [activeTab, setActiveTab] = useState('header');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ message: '', error: false });
  const [newCategory, setNewCategory] = useState('');

  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_STORAGE_KEY) || '');
  const [unlocked, setUnlocked] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!open) return;
    if (portfolio) {
      setDraft(structuredClone(portfolio));
      setStatus({ message: '', error: false });
    }

    if (!token) {
      setUnlocked(false);
      return;
    }

    let cancelled = false;
    setCheckingAuth(true);
    fetch('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!cancelled) {
          if (res.ok) {
            setUnlocked(true);
          } else {
            sessionStorage.removeItem(TOKEN_STORAGE_KEY);
            setToken('');
            setUnlocked(false);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setUnlocked(false);
      })
      .finally(() => {
        if (!cancelled) setCheckingAuth(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, portfolio, token]);

  if (!open || !draft) return null;

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Invalid password');
      sessionStorage.setItem(TOKEN_STORAGE_KEY, json.token);
      setToken(json.token);
      setUnlocked(true);
      setPasswordInput('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken('');
    setUnlocked(false);
    setStatus({ message: '', error: false });
  };

  const handleUnauthorized = () => {
    handleLogout();
    setAuthError('Session expired. Please enter your password again.');
  };

  const updateHeader = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      header: { ...prev.header, [field]: value },
    }));
  };

  const updateLink = (key, field, value) => {
    setDraft((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        links: {
          ...prev.header.links,
          [key]: { ...prev.header.links[key], [field]: value },
        },
      },
    }));
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus({ message: '', error: false });

    try {
      const dataBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/upload/resume', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ fileName: file.name, dataBase64 }),
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Resume upload failed');

      updateHeader('resumeFileName', json.resumeFileName);
      setStatus({ message: `Uploaded ${json.resumeFileName}`, error: false });
    } catch (err) {
      setStatus({ message: err.message, error: true });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus({ message: '', error: false });
    try {
      const res = await fetch('/api/portfolio', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(draft),
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save portfolio');
      onSaved(json);
      setStatus({ message: 'Saved to Node.js backend!', error: false });
    } catch (err) {
      setStatus({ message: err.message, error: true });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatus({ message: '', error: false });
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.status === 401) {
        const json = await res.json();
        throw new Error(json.error || 'Unauthorized');
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update password');
      sessionStorage.setItem(TOKEN_STORAGE_KEY, json.token);
      setToken(json.token);
      setCurrentPassword('');
      setNewPassword('');
      setStatus({ message: 'Admin password updated!', error: false });
    } catch (err) {
      setStatus({ message: err.message, error: true });
    }
  };

  return (
    <div className="drawer-backdrop" role="dialog" aria-modal="true" aria-label="Manage Portfolio">
      <div className="drawer-panel">
        <div className="drawer-header">
          <div>
            <h2 className="drawer-title">Manage Portfolio Content</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {unlocked
                ? 'Authenticated admin session · Changes save to Node.js'
                : 'Protected admin workspace · Enter password to unlock'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
            {unlocked && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleLogout}
                title="Lock Manage Panel"
              >
                <LogOut size={14} />
                Lock
              </button>
            )}
            <button type="button" className="btn btn-sm" onClick={onClose} aria-label="Close editor">
              <X size={16} />
            </button>
          </div>
        </div>

        {!unlocked ? (
          <div className="drawer-body" style={{ justifyContent: 'center' }}>
            <form onSubmit={handleLogin} className="editor-card" style={{ maxWidth: 440, margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Lock size={18} color="#ff5a36" />
                <strong>Admin Authentication Required</strong>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Only you can open and update your portfolio content, upload resumes, or add project images.
              </p>

              <div className="field">
                <label htmlFor="admin-password-input">Admin Password</label>
                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  <input
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="Enter admin password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="status-text error">{authError}</div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={checkingAuth || !passwordInput}
              >
                <Lock size={14} />
                {checkingAuth ? 'Verifying...' : 'Unlock Manage Panel'}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="drawer-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`drawer-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="drawer-body">
              {activeTab === 'header' && (
                <>
                  <div className="form-grid">
                    <div className="field">
                      <label>Full Name</label>
                      <input
                        className="input"
                        value={draft.header.fullName}
                        onChange={(e) => updateHeader('fullName', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Headline</label>
                      <input
                        className="input"
                        value={draft.header.headline}
                        onChange={(e) => updateHeader('headline', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Phone</label>
                      <input
                        className="input"
                        value={draft.header.phone}
                        onChange={(e) => updateHeader('phone', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Professional Email</label>
                      <input
                        className="input"
                        value={draft.header.email}
                        onChange={(e) => updateHeader('email', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>City / State</label>
                      <input
                        className="input"
                        value={draft.header.location}
                        onChange={(e) => updateHeader('location', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Availability Badge</label>
                      <input
                        className="input"
                        value={draft.header.availability}
                        onChange={(e) => updateHeader('availability', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Short Bio Summary</label>
                    <textarea
                      className="textarea"
                      value={draft.header.summary}
                      onChange={(e) => updateHeader('summary', e.target.value)}
                    />
                  </div>

                  <div className="editor-card">
                    <div className="editor-card-head">
                      <strong>Resume PDF Upload</strong>
                      {draft.header.resumeFileName && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
                          Current: {draft.header.resumeFileName}
                        </span>
                      )}
                    </div>
                    <label className="btn btn-sm" style={{ width: 'fit-content' }}>
                      <Upload size={14} />
                      {uploading ? 'Uploading...' : 'Upload PDF Resume'}
                      <input
                        type="file"
                        accept="application/pdf"
                        hidden
                        onChange={handleResumeUpload}
                      />
                    </label>
                  </div>

                  <div className="editor-card">
                    <strong>Proof Links (only active links with URLs are shown)</strong>
                    {Object.entries(draft.header.links || {}).map(([key, link]) => (
                      <div key={key} className="form-grid" style={{ alignItems: 'end' }}>
                        <div className="field">
                          <label>{link.label || key} URL</label>
                          <input
                            className="input"
                            placeholder="https://..."
                            value={link.url}
                            onChange={(e) => updateLink(key, 'url', e.target.value)}
                          />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem', paddingBottom: '0.55rem' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(link.active)}
                            onChange={(e) => updateLink(key, 'active', e.target.checked)}
                          />
                          Active on site
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'skills' && (
                <>
                  <div className="editor-card">
                    <div className="form-grid" style={{ alignItems: 'end' }}>
                      <div className="field">
                        <label>Add Skill Category</label>
                        <input
                          className="input"
                          placeholder="e.g. Testing & QA"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => {
                          const trimmed = newCategory.trim();
                          if (!trimmed || draft.skills[trimmed]) return;
                          setDraft((prev) => ({
                            ...prev,
                            skills: { ...prev.skills, [trimmed]: [] },
                          }));
                          setNewCategory('');
                        }}
                      >
                        <Plus size={14} />
                        Add Category
                      </button>
                    </div>
                  </div>

                  {Object.entries(draft.skills).map(([category, items]) => (
                    <div key={category} className="editor-card">
                      <div className="editor-card-head">
                        <strong>{category}</strong>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            setDraft((prev) => {
                              const next = { ...prev.skills };
                              delete next[category];
                              return { ...prev, skills: next };
                            });
                          }}
                        >
                          <Trash2 size={13} />
                          Remove
                        </button>
                      </div>
                      <div className="field">
                        <label>Comma-separated skills (bulk edit / paste)</label>
                        <textarea
                          className="textarea"
                          value={(items || []).join(', ')}
                          onChange={(e) => {
                            const nextList = splitComma(e.target.value);
                            setDraft((prev) => ({
                              ...prev,
                              skills: { ...prev.skills, [category]: nextList },
                            }));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {activeTab === 'projects' && (
                <>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ width: 'fit-content' }}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        projects: [
                          ...prev.projects,
                          {
                            id: `proj-${Date.now()}`,
                            title: 'New Full-Stack Project',
                            subtitle: '',
                            overview: '',
                            imageUrl: '',
                            liveUrl: '',
                            githubUrl: '',
                            techStack: ['React', 'Node.js'],
                            highlights: ['Describe architecture, auth, database design, and deployment impact.'],
                          },
                        ],
                      }))
                    }
                  >
                    <Plus size={14} />
                    Add Project
                  </button>

                  {draft.projects.map((project, idx) => {
                    const updateProj = (field, value) => {
                      setDraft((prev) => {
                        const next = [...prev.projects];
                        next[idx] = { ...next[idx], [field]: value };
                        return { ...prev, projects: next };
                      });
                    };

                    return (
                      <div key={project.id || idx} className="editor-card">
                        <div className="editor-card-head">
                          <strong>Project #{idx + 1}</strong>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                projects: prev.projects.filter((_, i) => i !== idx),
                              }))
                            }
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                        <div className="form-grid">
                          <div className="field">
                            <label>Title</label>
                            <input
                              className="input"
                              value={project.title}
                              onChange={(e) => updateProj('title', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Subtitle</label>
                            <input
                              className="input"
                              value={project.subtitle || ''}
                              onChange={(e) => updateProj('subtitle', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Live Demo URL</label>
                            <input
                              className="input"
                              value={project.liveUrl || ''}
                              onChange={(e) => updateProj('liveUrl', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>GitHub URL</label>
                            <input
                              className="input"
                              value={project.githubUrl || ''}
                              onChange={(e) => updateProj('githubUrl', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="field">
                          <label>Card Cover Image URL (or upload)</label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                              className="input"
                              placeholder="https://... or /uploads/..."
                              value={project.imageUrl || ''}
                              onChange={(e) => updateProj('imageUrl', e.target.value)}
                            />
                            <label className="btn btn-sm" style={{ flexShrink: 0 }}>
                              <Upload size={13} />
                              Upload
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                hidden
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const dataBase64 = await new Promise((resolve, reject) => {
                                      const r = new FileReader();
                                      r.onload = () => resolve(r.result);
                                      r.onerror = reject;
                                      r.readAsDataURL(file);
                                    });
                                    const res = await fetch('/api/upload/project-image', {
                                      method: 'POST',
                                      headers: authHeaders(),
                                      body: JSON.stringify({ fileName: file.name, dataBase64 }),
                                    });
                                    if (res.status === 401) {
                                      handleUnauthorized();
                                      return;
                                    }
                                    const json = await res.json();
                                    if (!res.ok) throw new Error(json.error || 'Upload failed');
                                    updateProj('imageUrl', json.url);
                                    setStatus({ message: 'Uploaded project cover image!', error: false });
                                  } catch (err) {
                                    setStatus({ message: err.message, error: true });
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="field">
                          <label>Detailed Overview (shown inside project popup modal)</label>
                          <textarea
                            className="textarea"
                            placeholder="Optional architecture breakdown shown when visitors click the project card..."
                            value={project.overview || ''}
                            onChange={(e) => updateProj('overview', e.target.value)}
                          />
                        </div>
                        <div className="field">
                          <label>Tech Stack (comma-separated)</label>
                          <input
                            className="input"
                            value={(project.techStack || []).join(', ')}
                            onChange={(e) => updateProj('techStack', splitComma(e.target.value))}
                          />
                        </div>
                        <div className="field">
                          <label>Impact Bullets (one per line, 3–4 recommended)</label>
                          <textarea
                            className="textarea"
                            style={{ minHeight: '115px' }}
                            value={(project.highlights || []).join('\n')}
                            onChange={(e) => updateProj('highlights', splitLines(e.target.value))}
                          />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {activeTab === 'experience' && (
                <>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Leave Experience empty to automatically hide the Experience section and give full focus to your Featured Projects.
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ width: 'fit-content' }}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        experiences: [
                          ...prev.experiences,
                          {
                            id: `exp-${Date.now()}`,
                            projectName: 'New Project Contribution',
                            company: 'Company / Platform',
                            companyRole: 'Software Engineering Contributor',
                            role: 'Software Engineering Contributor',
                            duration: 'May 2026 – Jul 2026',
                            employmentType: 'Project-based Contract',
                            workMode: 'Remote',
                            year: '2026',
                            category: 'Software Engineering',
                            earningsAmount: '',
                            earningsNumeric: 0,
                            icon: 'terminal',
                            shortDescription: '',
                            description: '',
                            responsibilities: ['Built REST APIs and automated test suites.'],
                            skills: ['Node.js', 'React', 'Docker'],
                            achievement: '',
                          },
                        ],
                      }))
                    }
                  >
                    <Plus size={14} />
                    Add Experience
                  </button>

                  {draft.experiences.map((exp, idx) => {
                    const updateExp = (field, value) => {
                      setDraft((prev) => {
                        const next = [...prev.experiences];
                        next[idx] = { ...next[idx], [field]: value };
                        return { ...prev, experiences: next };
                      });
                    };

                    const resps = exp.responsibilities || exp.highlights || [];

                    return (
                      <div key={exp.id || idx} className="editor-card">
                        <div className="editor-card-head">
                          <strong>Experience #{idx + 1}</strong>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                experiences: prev.experiences.filter((_, i) => i !== idx),
                              }))
                            }
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                        <div className="form-grid">
                          <div className="field">
                            <label>Project Name</label>
                            <input
                              className="input"
                              value={exp.projectName || ''}
                              onChange={(e) => updateExp('projectName', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Role</label>
                            <input
                              className="input"
                              value={exp.role || ''}
                              onChange={(e) => updateExp('role', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Company / Platform</label>
                            <input
                              className="input"
                              value={exp.company || ''}
                              onChange={(e) => updateExp('company', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Duration</label>
                            <input
                              className="input"
                              value={exp.duration || ''}
                              onChange={(e) => updateExp('duration', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Employment Type</label>
                            <input
                              className="input"
                              value={exp.employmentType || ''}
                              onChange={(e) => updateExp('employmentType', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Work Mode</label>
                            <input
                              className="input"
                              value={exp.workMode || ''}
                              onChange={(e) => updateExp('workMode', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Category</label>
                            <input
                              className="input"
                              value={exp.category || ''}
                              onChange={(e) => updateExp('category', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Earnings Display (e.g. $650+ USD)</label>
                            <input
                              className="input"
                              value={exp.earningsAmount || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const num = Number(val.replace(/[^0-9.]/g, '')) || 0;
                                updateExp('earningsAmount', val);
                                updateExp('earningsNumeric', num);
                              }}
                            />
                          </div>
                        </div>
                        <div className="field">
                          <label>Short Card Description</label>
                          <textarea
                            className="textarea"
                            value={exp.shortDescription || ''}
                            onChange={(e) => updateExp('shortDescription', e.target.value)}
                          />
                        </div>
                        <div className="field">
                          <label>Full Description</label>
                          <textarea
                            className="textarea"
                            value={exp.description || ''}
                            onChange={(e) => updateExp('description', e.target.value)}
                          />
                        </div>
                        <div className="field">
                          <label>Key Responsibilities (one per line)</label>
                          <textarea
                            className="textarea"
                            style={{ minHeight: '110px' }}
                            value={resps.join('\n')}
                            onChange={(e) => updateExp('responsibilities', splitLines(e.target.value))}
                          />
                        </div>
                        <div className="field">
                          <label>Technologies &amp; Skills (comma-separated)</label>
                          <input
                            className="input"
                            value={(exp.skills || []).join(', ')}
                            onChange={(e) => updateExp('skills', splitComma(e.target.value))}
                          />
                        </div>
                        <div className="field">
                          <label>Achievement Note</label>
                          <input
                            className="input"
                            value={exp.achievement || ''}
                            onChange={(e) => updateExp('achievement', e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {activeTab === 'education' && (
                <div className="editor-card">
                  <div className="form-grid">
                    <div className="field">
                      <label>Degree</label>
                      <input
                        className="input"
                        value={draft.education.degree}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            education: { ...prev.education, degree: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label>College Name</label>
                      <input
                        className="input"
                        value={draft.education.college}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            education: { ...prev.education, college: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Expected Graduation Year</label>
                      <input
                        className="input"
                        value={draft.education.graduationYear}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            education: { ...prev.education, graduationYear: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label>CGPA</label>
                      <input
                        className="input"
                        value={draft.education.cgpa}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            education: { ...prev.education, cgpa: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(draft.education.showCgpa)}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          education: { ...prev.education, showCgpa: e.target.checked },
                        }))
                      }
                    />
                    Display CGPA on portfolio (recommended if 7.5+ or required for placements)
                  </label>

                  <div className="field">
                    <label>4 Core CS Subjects (one per line)</label>
                    <textarea
                      className="textarea"
                      value={(draft.education.coreSubjects || []).join('\n')}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          education: {
                            ...prev.education,
                            coreSubjects: splitLines(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              {activeTab === 'certifications' && (
                <>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ width: 'fit-content' }}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        certifications: [
                          ...(prev.certifications || []),
                          {
                            id: `cert-${Date.now()}`,
                            title: 'New Certification',
                            issuer: 'Issuing Organization',
                            date: '2026',
                            credentialId: '',
                            url: '',
                          },
                        ],
                      }))
                    }
                  >
                    <Plus size={14} />
                    Add Certification
                  </button>

                  {(draft.certifications || []).map((cert, idx) => {
                    const updateCert = (field, value) => {
                      setDraft((prev) => {
                        const next = [...(prev.certifications || [])];
                        next[idx] = { ...next[idx], [field]: value };
                        return { ...prev, certifications: next };
                      });
                    };

                    return (
                      <div key={cert.id || idx} className="editor-card">
                        <div className="editor-card-head">
                          <strong>Certification #{idx + 1}</strong>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                certifications: (prev.certifications || []).filter((_, i) => i !== idx),
                              }))
                            }
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                        <div className="form-grid">
                          <div className="field">
                            <label>Certification Title</label>
                            <input
                              className="input"
                              value={cert.title}
                              onChange={(e) => updateCert('title', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Issuer</label>
                            <input
                              className="input"
                              value={cert.issuer || ''}
                              onChange={(e) => updateCert('issuer', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Year / Date</label>
                            <input
                              className="input"
                              value={cert.date || ''}
                              onChange={(e) => updateCert('date', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Credential ID</label>
                            <input
                              className="input"
                              value={cert.credentialId || ''}
                              onChange={(e) => updateCert('credentialId', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="field">
                          <label>Verification URL</label>
                          <input
                            className="input"
                            placeholder="https://..."
                            value={cert.url || ''}
                            onChange={(e) => updateCert('url', e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {activeTab === 'achievements' && (
                <>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ width: 'fit-content' }}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        achievements: [
                          ...prev.achievements,
                          {
                            id: `ach-${Date.now()}`,
                            category: 'Hackathon',
                            title: 'New Achievement',
                            metric: 'Finalist',
                            description: '',
                            url: '',
                          },
                        ],
                      }))
                    }
                  >
                    <Plus size={14} />
                    Add Achievement
                  </button>

                  {draft.achievements.map((item, idx) => {
                    const updateAch = (field, value) => {
                      setDraft((prev) => {
                        const next = [...prev.achievements];
                        next[idx] = { ...next[idx], [field]: value };
                        return { ...prev, achievements: next };
                      });
                    };

                    return (
                      <div key={item.id || idx} className="editor-card">
                        <div className="editor-card-head">
                          <strong>Achievement #{idx + 1}</strong>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                achievements: prev.achievements.filter((_, i) => i !== idx),
                              }))
                            }
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                        <div className="form-grid">
                          <div className="field">
                            <label>Category</label>
                            <input
                              className="input"
                              value={item.category}
                              onChange={(e) => updateAch('category', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Metric / Badge</label>
                            <input
                              className="input"
                              value={item.metric || ''}
                              onChange={(e) => updateAch('metric', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Title</label>
                            <input
                              className="input"
                              value={item.title}
                              onChange={(e) => updateAch('title', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Profile / Verification URL</label>
                            <input
                              className="input"
                              value={item.url || ''}
                              onChange={(e) => updateAch('url', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="field">
                          <label>Description</label>
                          <textarea
                            className="textarea"
                            value={item.description || ''}
                            onChange={(e) => updateAch('description', e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {activeTab === 'security' && (
                <form onSubmit={handleChangePassword} className="editor-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <KeyRound size={16} color="#ff5a36" />
                    <strong>Change Admin Password</strong>
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label>Current Password</label>
                      <input
                        type="password"
                        className="input"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label>New Password (min 6 chars)</label>
                      <input
                        type="password"
                        className="input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ width: 'fit-content' }}>
                    Update Password
                  </button>
                </form>
              )}
            </div>

            <div className="drawer-footer">
              <span className={`status-text ${status.error ? 'error' : ''}`}>
                {status.message}
              </span>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button type="button" className="btn btn-sm" onClick={onClose}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={saving}
                  onClick={handleSave}
                >
                  <Save size={14} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
