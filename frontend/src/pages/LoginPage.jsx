import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

import { API_URL as API } from '../config';

function BrandMark({ size = 'md', center = false }) {
  const sizes = {
    sm: { logo: '1.2rem', sub: '0.7rem' },
    md: { logo: '1.6rem', sub: '0.78rem' },
    lg: { logo: '2.2rem', sub: '0.85rem' },
  };
  const s = sizes[size] || sizes.md;
  return (
    <div className="brand" style={center ? { justifyContent: 'center' } : {}}>
      <span className="brand-logo" style={{ fontSize: s.logo }}>
        <span className="brand-sig">SIG</span>
      </span>
    </div>
  );
}

function Footer() {
  return (
    <div className="footer">
      <div className="footer-text">Powered by SIG Reality Club</div>
    </div>
  );
}

export { BrandMark, Footer };

export default function LoginPage() {
  const [tab, setTab] = useState('participant'); // 'participant' | 'organizer'
  const navigate = useNavigate();
  const { setRole, setTeamId, setRoomId, setOrganizer } = useGame();

  // Participant state
  const [pTeamId, setPTeamId] = useState('');
  const [pRoomId, setPRoomId] = useState('');
  const [pError, setPError] = useState('');
  const [pLoading, setPLoading] = useState(false);

  // Organizer state
  const [oUsername, setOUsername] = useState('');
  const [oPassword, setOPassword] = useState('');
  const [oError, setOError] = useState('');
  const [oLoading, setOLoading] = useState(false);

  const handleParticipantJoin = async (e) => {
    e.preventDefault();
    if (!pTeamId.trim() || !pRoomId.trim()) { setPError('Please fill in all fields'); return; }
    setPLoading(true); setPError('');
    try {
      const res = await fetch(`${API}/rooms/${pRoomId.toUpperCase()}`);
      const data = await res.json();
      if (!data.exists) { setPError('Room not found. Check your Room ID.'); return; }
      if (data.state !== 'WAITING') { setPError('Game has already started. You cannot join now.'); return; }
      setRole('participant');
      setTeamId(pTeamId.trim().toUpperCase());
      setRoomId(pRoomId.trim().toUpperCase());
      navigate('/waiting');
    } catch {
      setPError('Cannot connect to server. Is the backend running?');
    } finally {
      setPLoading(false);
    }
  };

  const handleOrganizerLogin = async (e) => {
    e.preventDefault();
    if (!oUsername.trim() || !oPassword.trim()) { setOError('Please fill in all fields'); return; }
    setOLoading(true); setOError('');
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: oUsername, password: oPassword }),
      });
      const data = await res.json();
      if (!data.success) { setOError('Invalid credentials. Try admin / admin123'); return; }
      setRole('organizer');
      setOrganizer(data.username);
      navigate('/organizer');
    } catch {
      setOError('Cannot connect to server. Is the backend running?');
    } finally {
      setOLoading(false);
    }
  };

  return (
    <div className="page" style={{ padding: 0, gap: 0 }}>

      {/* Hero Banner */}
      <div className="hero-banner anim-fadeIn">
        <div className="hero-eyebrow">⚡ Live Hackathon Platform</div>
        <h1 className="hero-title">
          <span className="highlight-blue">SIG</span>
          <br />
          Hackathon Experience
        </h1>
        <p className="hero-subtitle">
          Solve riddles. Write code. Earn digits. Crack the locker. First team wins.
        </p>
      </div>

      {/* Login Card */}
      <div style={{ width: '100%', maxWidth: 460, padding: '2.5rem 2rem' }} className="anim-fadeInUp">

        <BrandMark size="md" center />

        <div className="card">
          {/* Tabs */}
          <div className="tab-group">
            <button id="tab-participant" className={`tab-btn ${tab === 'participant' ? 'active' : ''}`} onClick={() => setTab('participant')}>
              🏃 Participant
            </button>
            <button id="tab-organizer" className={`tab-btn ${tab === 'organizer' ? 'active' : ''}`} onClick={() => setTab('organizer')}>
              🎛️ Organizer
            </button>
          </div>

          {/* Participant Form */}
          {tab === 'participant' && (
            <form onSubmit={handleParticipantJoin} className="anim-fadeIn">
              {pError && <div className="alert alert-error">{pError}</div>}
              <div className="form-group">
                <label className="form-label" htmlFor="team-id">Team ID</label>
                <input
                  id="team-id"
                  className="form-input"
                  placeholder="e.g. TEAM_ALPHA"
                  value={pTeamId}
                  onChange={e => setPTeamId(e.target.value)}
                  maxLength={20}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="room-id">Room ID</label>
                <input
                  id="room-id"
                  className="form-input"
                  placeholder="6-character code from organizer"
                  value={pRoomId}
                  onChange={e => setPRoomId(e.target.value.toUpperCase())}
                  maxLength={10}
                />
              </div>
              <button id="btn-join" type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={pLoading}>
                {pLoading ? 'Joining…' : '🚀 Join Game'}
              </button>
            </form>
          )}

          {/* Organizer Form */}
          {tab === 'organizer' && (
            <form onSubmit={handleOrganizerLogin} className="anim-fadeIn">
              {oError && <div className="alert alert-error">{oError}</div>}
              <div className="form-group">
                <label className="form-label" htmlFor="org-username">Username</label>
                <input
                  id="org-username"
                  className="form-input"
                  placeholder="admin"
                  value={oUsername}
                  onChange={e => setOUsername(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="org-password">Password</label>
                <input
                  id="org-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={oPassword}
                  onChange={e => setOPassword(e.target.value)}
                />
              </div>
              <button id="btn-org-login" type="submit" className="btn btn-yellow btn-lg" style={{ width: '100%' }} disabled={oLoading}>
                {oLoading ? 'Logging in…' : '🔐 Enter Dashboard'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--rb-muted)' }}>
          Organizer credentials: <code>admin</code> / <code>admin123</code>
        </p>

        <Footer />
      </div>
    </div>
  );
}
