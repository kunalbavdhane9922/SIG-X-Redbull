import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../context/WebSocketContext';
import { useGame } from '../context/GameContext';

import { API_URL as API } from '../config';
const GAME_DURATION = 5 * 60; // 5 minutes

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { connect, joinRoom, on, emit, connected } = useWebSocket();
  const { organizer, roomId, setRoomId } = useGame();

  const [participants, setParticipants] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [creating, setCreating] = useState(false);
  const [roomCreated, setRoomCreated] = useState(false);
  const [finishedTeams, setFinishedTeams] = useState([]);
  const [teamProgress, setTeamProgress]  = useState({}); // teamId -> stage completed
  const timerRef = useRef(null);
  const cleanupRef = useRef([]);

  // Redirect if not organizer
  useEffect(() => {
    if (!organizer) navigate('/');
  }, [organizer]);

  // Connect to Socket.IO and join room after room is created
  useEffect(() => {
    if (!roomId) return;

    const socket = connect();

    const setupListeners = () => {
      // Listen for room-wide events
      const unsub = on('room-event', (event) => {
        if (event.type === 'PARTICIPANT_LIST') {
          setParticipants(event.payload.participants || []);
        }
        if (event.type === 'TEAM_PROGRESS') {
          const { teamId, stage } = event.payload;
          setTeamProgress(prev => ({ ...prev, [teamId]: Math.max(prev[teamId] || 0, stage) }));
        }
        if (event.type === 'TEAM_FINISHED') {
          setFinishedTeams(prev =>
            prev.includes(event.payload.teamId) ? prev : [...prev, event.payload.teamId]
          );
        }
      });

      cleanupRef.current = [unsub];

      // Join the room as organizer (observer)
      joinRoom(roomId, null, 'organizer');
    };

    if (socket.connected) {
      setupListeners();
    } else {
      socket.once('connect', setupListeners);
    }

    return () => {
      cleanupRef.current.forEach(fn => fn?.());
      socket.off('connect', setupListeners);
    };
  }, [roomId]);

  // Countdown timer
  useEffect(() => {
    if (!gameStarted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameStarted]);

  const handleCreateRoom = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${API}/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizer }),
      });
      const data = await res.json();
      if (data.success) {
        setRoomId(data.roomId);
        setRoomCreated(true);
        setParticipants([]);
        setGameStarted(false);
        setFinishedTeams([]);
        setTeamProgress({});
        setTimeLeft(GAME_DURATION);
      } else {
        alert('Failed to create room: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Cannot connect to backend. Is it running on port 8080?');
    } finally {
      setCreating(false);
    }
  };

  const handleStartGame = () => {
    if (!roomId || !connected) return;
    emit('start-game', { roomId });
    setGameStarted(true);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getProgressBadge = (teamId) => {
    if (finishedTeams.includes(teamId)) return <span className="badge badge-green">🏆 Finished</span>;
    const stage = teamProgress[teamId];
    if (stage) return <span className="badge badge-yellow">Stage {stage} ✓</span>;
    if (gameStarted) return <span className="badge badge-red">Playing…</span>;
    return null;
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      {/* Top Bar */}
      <div className="top-bar">
        <div className="brand" style={{ margin: 0 }}>
          <span className="brand-logo" style={{ fontSize: '1.15rem' }}>
            <span className="brand-sig">SIG</span>
          </span>
          <div className="brand-divider" />
          <span className="brand-sub" style={{ fontSize: '0.72rem' }}>Organizer</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className={`badge ${connected ? 'badge-green' : 'badge-red'}`}>
            {connected ? '● Connected' : '○ Disconnected'}
          </span>
          {gameStarted && (
            <div className={`timer ${timeLeft < 60 ? 'danger' : ''}`}>
              ⏱ {formatTime(timeLeft)}
            </div>
          )}
          <span style={{ fontSize: '0.85rem', color: 'var(--rb-muted)', fontWeight: 600 }}>👤 {organizer}</span>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem', paddingTop: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* Left Panel — Room Control */}
          <div>
            <div className="card anim-fadeInUp" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ marginBottom: '1.5rem' }}>🎮 Room Control</h2>

              {!roomCreated ? (
                <>
                  <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Create a new game room and share the Room ID with participants.
                  </p>
                  <button
                    id="btn-create-room"
                    className="btn btn-yellow btn-lg"
                    style={{ width: '100%' }}
                    onClick={handleCreateRoom}
                    disabled={creating}
                  >
                    {creating ? 'Creating…' : '🏗️ Create Room'}
                  </button>
                </>
              ) : (
                <>
                  <div style={{
                    background: 'rgba(255,233,0,0.06)',
                    border: '1px solid rgba(255,233,0,0.2)',
                    borderRadius: 'var(--radius)',
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--rb-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', fontWeight: 700 }}>
                      Room ID — Share this!
                    </div>
                    <div style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: '2.5rem',
                      fontWeight: 900,
                      color: 'var(--rb-yellow)',
                      letterSpacing: '0.15em'
                    }}>
                      {roomId}
                    </div>
                  </div>

                  <div className="divider" />

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--rb-muted)', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Participants Joined</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--rb-text)' }}>
                      {participants.length} <span style={{ fontSize: '0.9rem', color: 'var(--rb-muted)', fontWeight: 400 }}>teams</span>
                    </div>
                  </div>

                  {finishedTeams.length > 0 && (
                    <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(0,230,118,0.06)', borderRadius: 'var(--radius)', border: '1px solid rgba(0,230,118,0.15)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--rb-success)', fontWeight: 700, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        🏆 Teams Finished
                      </div>
                      {finishedTeams.map((t, i) => (
                        <div key={t} style={{ fontFamily: 'JetBrains Mono', fontSize: '0.9rem', color: 'var(--rb-text)' }}>
                          #{i + 1} {t}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    id="btn-start-game"
                    className={`btn btn-lg ${gameStarted ? 'btn-secondary' : 'btn-primary anim-glow'}`}
                    style={{ width: '100%', marginBottom: '0.75rem' }}
                    onClick={handleStartGame}
                    disabled={gameStarted || participants.length === 0 || !connected}
                  >
                    {gameStarted ? '✅ Game Running' : '🚀 Start Game'}
                  </button>

                  {!gameStarted && (
                    <button
                      className="btn btn-secondary"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                      onClick={handleCreateRoom}
                      disabled={creating}
                    >
                      🔄 Create New Room
                    </button>
                  )}

                  {participants.length === 0 && !gameStarted && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--rb-muted)', textAlign: 'center', marginTop: '0.75rem' }}>
                      Waiting for participants to join…
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Game Info */}
            {gameStarted && (
              <div className="card anim-scaleIn">
                <h3 style={{ marginBottom: '1rem' }}>📋 Game Info</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--rb-muted)' }}>Stage 1</span>
                    <span>Sum of Array → <code style={{ color: 'var(--rb-yellow)' }}>1200</code></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--rb-muted)' }}>Stage 2</span>
                    <span>Reverse String → <code style={{ color: 'var(--rb-yellow)' }}>34</code></span>
                  </div>
                  <div className="divider" />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--rb-muted)' }}>Final Equation</span>
                    <span style={{ color: 'var(--rb-yellow)', fontFamily: 'JetBrains Mono' }}>1200 + 34 = 1234</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer in sidebar */}
            <div className="footer" style={{ marginTop: '1.5rem' }}>
              <div className="footer-text">Powered by SIG Reality Club</div>
            </div>
          </div>

          {/* Right Panel — Participant List */}
          <div className="card anim-slideInRight">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2>👥 Teams</h2>
              <span className="badge badge-red">{participants.length} joined</span>
            </div>

            {participants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--rb-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏁</div>
                <p>No teams have joined yet.<br />Share the Room ID above.</p>
              </div>
            ) : (
              <div className="participant-list">
                {participants.map((team, i) => (
                  <div key={team} className="participant-item anim-fadeInUp" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="participant-avatar">{team.slice(0, 2).toUpperCase()}</div>
                    <span style={{ fontWeight: 600 }}>{team}</span>
                    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getProgressBadge(team)}
                      <span style={{ fontSize: '0.75rem', color: 'var(--rb-muted)' }}>#{i + 1}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
