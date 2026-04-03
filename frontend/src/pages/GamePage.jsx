import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useWebSocket } from '../context/WebSocketContext';
import { useGame } from '../context/GameContext';

const GAME_DURATION = 5 * 60; // 5 minutes

export default function GamePage() {
  const navigate = useNavigate();
  const { subscribe, publish, connected, connect } = useWebSocket();
  const { teamId, roomId, question, setQuestion, setCurrentStage, currentStage, digits, setDigits } = useGame();
  const roomSubRef = useRef(null);
  const teamSubRef = useRef(null);

  const [code, setCode] = useState('// write your code here');
  const [language, setLanguage] = useState('java'); // 'java' | 'cpp'
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);       // { passed, digit, message }
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [stageLocked, setStageLocked] = useState(false);
  const timerRef = useRef(null);

  // Redirect if no session
  useEffect(() => {
    if (!teamId || !roomId) { navigate('/'); return; }

    // Start with blank comment
    setCode('// write your code here');

    connect(() => {
      // Room-wide events
      roomSubRef.current = subscribe(`/topic/room/${roomId}`, (event) => {});

      // Per-team events (RESULT, QUESTION_DATA, GAME_END)
      teamSubRef.current = subscribe(`/topic/room/${roomId}/team/${teamId}`, (event) => {
        if (event.type === 'RESULT') {
          const p = event.payload;
          setSubmitting(false);
          setResult({ passed: p.passed, digit: p.digit, message: p.message });
          if (p.passed) {
            setStageLocked(true);
            setDigits(prev => {
              const next = [...prev];
              next[(p.stage || currentStage) - 1] = p.digit;
              return next;
            });
          }
        }
        if (event.type === 'QUESTION_DATA') {
          const q = event.payload;
          setQuestion(q);
          setCurrentStage(q.stage);
          // Always reset to generic comment
          setCode('// write your code here');
          setResult(null);
          setStageLocked(false);
        }
        if (event.type === 'GAME_END') {
          const payload = event.payload;
          if (payload.values) {
            setDigits([payload.values.X, payload.values.Y]);
          }
          navigate('/completion');
        }
        if (event.type === 'ERROR') {
          setSubmitting(false);
          setResult({ passed: false, message: event.payload?.message });
        }
      });
    });

    return () => {
      roomSubRef.current?.unsubscribe();
      teamSubRef.current?.unsubscribe();
    };
  }, [teamId, roomId]);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleSubmit = () => {
    if (!code.trim() || submitting || stageLocked || timeLeft === 0) return;
    setSubmitting(true);
    setResult(null);
    publish('/app/submit', { teamId, roomId, code, stage: currentStage, language });
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      {/* Top Bar */}
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="brand-logo" style={{ fontSize: '1.1rem' }}>
            <span className="brand-sig">SIG</span>
          </span>
          <span className="badge badge-red">Stage {currentStage}</span>
          <span className="badge badge-yellow" style={{ fontFamily: 'JetBrains Mono' }}>👤 {teamId}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className={`timer ${timeLeft < 60 ? 'danger' : ''}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {digits.filter(d => d != null).map((d, i) => (
              <span key={i} className="badge badge-green" style={{ fontFamily: 'JetBrains Mono' }}>
                💡 {d}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Game Layout */}
      <div className="game-layout">

        {/* Left — Riddle Panel */}
        <div className="game-panel">
          <div className="card anim-fadeInUp" style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div className="challenge-label" style={{ marginBottom: '0.75rem' }}>
                ⚡ SIG Challenge — Stage {currentStage}
              </div>
              <h2 style={{ marginTop: '0.5rem' }}>🧩 The Riddle</h2>
            </div>

            <div className="riddle-panel">
              "{question?.riddle || 'Waiting for question...'}"
            </div>

            <div className="divider" />

            <h3 style={{ marginBottom: '1.25rem' }}>📝 Constraints</h3>
            <div style={{ color: 'var(--rb-silver)', fontSize: '0.95rem' }}>
               No additional hints provided for this challenge. 🎯
            </div>

            {/* Result feedback */}
            {result && (
              <div className={`alert ${result.passed ? 'alert-success' : 'alert-error'} anim-scaleIn`} style={{ marginTop: '2rem' }}>
                {result.passed
                  ? `✅ Correct! Stage ${currentStage} unlocked.`
                  : `❌ ${result.message || 'Wrong answer. Check your logic.'}`}
              </div>
            )}

            {stageLocked && (
              <div className="alert alert-info" style={{ marginTop: '0.75rem' }}>
                ⏳ Waiting for the next challenge…
              </div>
            )}
          </div>
        </div>

        {/* Right — Code Editor Panel */}
        <div className="game-panel">
          <div className="card" style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            
            {/* Header with Language Selector + Powered by SIG badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem 1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💻 Code Editor
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="powered-badge">⚙ Powered by SIG</div>
                <div className="tab-group" style={{ margin: 0, padding: '2px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--rb-glass-border)' }}>
                  <button 
                    className={`tab-btn ${language === 'java' ? 'active' : ''}`} 
                    onClick={() => setLanguage('java')}
                    style={{ padding: '4px 16px', fontSize: '0.8rem' }}
                  >
                    Java
                  </button>
                  <button 
                    className={`tab-btn ${language === 'cpp' ? 'active' : ''}`} 
                    onClick={() => setLanguage('cpp')}
                    style={{ padding: '4px 16px', fontSize: '0.8rem' }}
                  >
                    C++
                  </button>
                </div>
              </div>
            </div>

            <div className="editor-wrapper" style={{ flex: 1, border: '1px solid rgba(255,255,255,0.08)', background: '#0d0d0d' }}>
              <Editor
                height="100%"
                language={language === 'cpp' ? 'cpp' : 'java'}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  fontSize: 15,
                  fontFamily: "'JetBrains Mono', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  renderLineHighlight: 'line',
                  padding: { top: 16 },
                  readOnly: stageLocked || timeLeft === 0,
                }}
              />
            </div>
            
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', padding: '0.5rem' }}>
              <button
                id="btn-submit-code"
                className="btn btn-primary btn-lg"
                onClick={handleSubmit}
                disabled={submitting || stageLocked || timeLeft === 0 || !connected}
                style={{ minWidth: '160px' }}
              >
                {submitting ? '⏳ Testing…' : stageLocked ? '✅ Complete' : '🚀 Submit Code'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
