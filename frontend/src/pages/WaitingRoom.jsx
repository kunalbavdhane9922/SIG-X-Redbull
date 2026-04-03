import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../context/WebSocketContext';
import { useGame } from '../context/GameContext';

export default function WaitingRoom() {
  const navigate = useNavigate();
  const { connect, joinRoom, on, connected } = useWebSocket();
  const { teamId, roomId, setGameState, setQuestion, setCurrentStage } = useGame();
  const [joinError, setJoinError] = useState('');
  const [joined, setJoined] = useState(false);
  const cleanupRef = useRef([]);

  useEffect(() => {
    if (!teamId || !roomId) { navigate('/'); return; }

    // Connect to Socket.IO
    const socket = connect();

    // Wait for connection, then set up listeners and join
    const onConnect = () => {
      // Listen for team-specific events (JOIN_OK, ERROR)
      const unsub1 = on('team-event', (event) => {
        if (event.type === 'JOIN_OK') {
          setJoined(true);
          setJoinError('');
        }
        if (event.type === 'ERROR') {
          setJoinError(event.payload?.message || 'Unknown error');
        }
      });

      // Listen for room-wide events (GAME_START, QUESTION_DATA)
      const unsub2 = on('room-event', (event) => {
        if (event.type === 'GAME_START') {
          setGameState('PLAYING');
        }
        if (event.type === 'QUESTION_DATA') {
          setQuestion(event.payload);
          setCurrentStage(event.payload.stage);
          navigate('/game');
        }
      });

      cleanupRef.current = [unsub1, unsub2];

      // Send join request
      joinRoom(roomId, teamId, 'participant');
    };

    // If already connected, join immediately
    if (socket.connected) {
      onConnect();
    } else {
      socket.once('connect', onConnect);
    }

    return () => {
      cleanupRef.current.forEach(fn => fn?.());
      socket.off('connect', onConnect);
    };
  }, [teamId, roomId]);

  return (
    <div className="page">
      <div style={{ width: '100%', maxWidth: 600, textAlign: 'center' }} className="anim-scaleIn">

        {/* Branding */}
        <div className="brand" style={{ justifyContent: 'center', marginBottom: '2.5rem' }}>
          <span className="brand-logo" style={{ fontSize: '2.2rem' }}>
            <span className="brand-sig">SIG</span>
          </span>
        </div>

        <div className="challenge-label anim-float" style={{ marginBottom: '2rem' }}>
          ⚡ Hackathon Experience — Waiting Room
        </div>

        {/* Error */}
        {joinError && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            ❌ {joinError}
            <br />
            <button className="btn btn-secondary" style={{ marginTop: '0.75rem' }} onClick={() => navigate('/')}>
              ← Back to Login
            </button>
          </div>
        )}

        {/* Status Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span className="pulse-ring"></span>
            <span style={{ fontWeight: 600, color: 'var(--rb-silver)' }}>
              {joined ? 'Waiting for organizer to start...' : connected ? 'Joining room...' : 'Connecting...'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--rb-glass-border)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--rb-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem', fontWeight: 700 }}>Team ID</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '1.1rem', color: 'var(--rb-yellow)' }}>{teamId}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--rb-glass-border)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--rb-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem', fontWeight: 700 }}>Room ID</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '1.1rem', color: 'var(--rb-yellow)' }}>{roomId}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
            <span className={`badge ${joined ? 'badge-green' : connected ? 'badge-yellow' : 'badge-red'}`}>
              {joined ? '✓ Joined Successfully' : connected ? '○ Connecting...' : '○ Waiting for connection'}
            </span>
          </div>
        </div>

        {/* QR Codes section */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--rb-silver)' }}>📱 Scan to Join</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* QR Code 1 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 120, height: 120, margin: '0 auto 0.75rem',
                background: 'white', borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px'
              }}>
                <svg viewBox="0 0 21 21" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="0" width="7" height="7" fill="none" stroke="#000" strokeWidth="1"/>
                  <rect x="1" y="1" width="5" height="5" fill="#000"/>
                  <rect x="2" y="2" width="3" height="3" fill="white"/>
                  <rect x="14" y="0" width="7" height="7" fill="none" stroke="#000" strokeWidth="1"/>
                  <rect x="15" y="1" width="5" height="5" fill="#000"/>
                  <rect x="16" y="2" width="3" height="3" fill="white"/>
                  <rect x="0" y="14" width="7" height="7" fill="none" stroke="#000" strokeWidth="1"/>
                  <rect x="1" y="15" width="5" height="5" fill="#000"/>
                  <rect x="2" y="16" width="3" height="3" fill="white"/>
                  <rect x="8" y="0" width="1" height="1" fill="#000"/>
                  <rect x="10" y="0" width="1" height="1" fill="#000"/>
                  <rect x="12" y="0" width="1" height="1" fill="#000"/>
                  <rect x="8" y="2" width="2" height="1" fill="#000"/>
                  <rect x="11" y="2" width="1" height="2" fill="#000"/>
                  <rect x="7" y="8" width="2" height="1" fill="#000"/>
                  <rect x="10" y="8" width="3" height="1" fill="#000"/>
                  <rect x="14" y="8" width="1" height="1" fill="#000"/>
                  <rect x="7" y="10" width="1" height="2" fill="#000"/>
                  <rect x="9" y="10" width="2" height="1" fill="#000"/>
                  <rect x="12" y="10" width="2" height="2" fill="#000"/>
                  <rect x="15" y="10" width="3" height="1" fill="#000"/>
                  <rect x="8" y="14" width="1" height="3" fill="#000"/>
                  <rect x="10" y="14" width="2" height="1" fill="#000"/>
                  <rect x="13" y="14" width="1" height="2" fill="#000"/>
                  <rect x="15" y="15" width="2" height="3" fill="#000"/>
                  <rect x="18" y="14" width="1" height="2" fill="#000"/>
                </svg>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--rb-muted)' }}>Game Room</div>
            </div>
            {/* QR Code 2 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 120, height: 120, margin: '0 auto 0.75rem',
                background: 'white', borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px'
              }}>
                <svg viewBox="0 0 21 21" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="0" width="7" height="7" fill="none" stroke="#000" strokeWidth="1"/>
                  <rect x="1" y="1" width="5" height="5" fill="#000"/>
                  <rect x="2" y="2" width="3" height="3" fill="white"/>
                  <rect x="14" y="0" width="7" height="7" fill="none" stroke="#000" strokeWidth="1"/>
                  <rect x="15" y="1" width="5" height="5" fill="#000"/>
                  <rect x="16" y="2" width="3" height="3" fill="white"/>
                  <rect x="0" y="14" width="7" height="7" fill="none" stroke="#000" strokeWidth="1"/>
                  <rect x="1" y="15" width="5" height="5" fill="#000"/>
                  <rect x="2" y="16" width="3" height="3" fill="white"/>
                  <rect x="9" y="1" width="1" height="1" fill="#000"/>
                  <rect x="11" y="1" width="2" height="1" fill="#000"/>
                  <rect x="8" y="3" width="1" height="1" fill="#000"/>
                  <rect x="10" y="3" width="1" height="2" fill="#000"/>
                  <rect x="13" y="3" width="1" height="1" fill="#000"/>
                  <rect x="7" y="7" width="3" height="1" fill="#000"/>
                  <rect x="11" y="7" width="2" height="2" fill="#000"/>
                  <rect x="14" y="7" width="3" height="1" fill="#000"/>
                  <rect x="7" y="9" width="2" height="2" fill="#000"/>
                  <rect x="10" y="9" width="1" height="1" fill="#000"/>
                  <rect x="13" y="9" width="1" height="2" fill="#000"/>
                  <rect x="16" y="9" width="2" height="1" fill="#000"/>
                  <rect x="9" y="14" width="2" height="1" fill="#000"/>
                  <rect x="12" y="14" width="2" height="2" fill="#000"/>
                  <rect x="15" y="14" width="1" height="1" fill="#000"/>
                  <rect x="17" y="15" width="2" height="2" fill="#000"/>
                  <rect x="8" y="16" width="1" height="2" fill="#000"/>
                  <rect x="10" y="17" width="3" height="1" fill="#000"/>
                </svg>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--rb-muted)' }}>SIG Website</div>
            </div>
          </div>
        </div>

        <p style={{ marginTop: '2rem', color: 'var(--rb-muted)', fontSize: '0.85rem' }}>
          🏆 Solve the fastest to unlock the locker first
        </p>

        {/* Footer */}
        <div className="footer">
          <div className="footer-text">Powered by SIG Reality Club</div>
        </div>
      </div>
    </div>
  );
}
