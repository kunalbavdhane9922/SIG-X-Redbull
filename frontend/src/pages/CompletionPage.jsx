import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function CompletionPage() {
  const navigate = useNavigate();
  const { teamId, digits, resetGame } = useGame();
  const [codeInput, setCodeInput] = useState('');
  const [validated, setValidated] = useState(null); // null | 'correct' | 'wrong'

  const x = digits[0] ?? '?';
  const y = digits[1] ?? '?';
  const canCalculate = digits[0] != null && digits[1] != null;
  const finalAnswer = canCalculate ? Number(digits[0]) + Number(digits[1]) : null;

  const handleValidate = () => {
    if (!canCalculate) return;
    const entered = parseInt(codeInput.trim(), 10);
    setValidated(entered === finalAnswer ? 'correct' : 'wrong');
  };

  const handlePlayAgain = () => {
    resetGame();
    navigate('/');
  };

  return (
    <div className="page">
      <div style={{ width: '100%', maxWidth: 680, textAlign: 'center' }} className="anim-scaleIn">

        {/* Branding */}
        <div className="brand" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
          <span className="brand-logo" style={{ fontSize: '2rem' }}>
            <span className="brand-sig">SIG</span>
          </span>
        </div>

        <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>
          {canCalculate ? '🏆' : '⏳'}
        </div>
        <h1 style={{ marginBottom: '0.5rem' }}>
          {canCalculate ? 'All Stages Complete!' : 'Stage In Progress'}
        </h1>
        <p style={{ marginBottom: '2.5rem' }}>
          {canCalculate
            ? `Outstanding work, ${teamId || 'Team'}! Now calculate the final locker code below.`
            : `Great effort! Here are your collected values so far.`}
        </p>

        {/* Digit Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div className="digit-card anim-fadeInUp">
            <div className="digit-label">Stage 1 — X</div>
            <div className="digit-value">{x}</div>
          </div>
          <div className="digit-card anim-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <div className="digit-label">Stage 2 — Y</div>
            <div className="digit-value">{y}</div>
          </div>
        </div>

        {/* Equation */}
        <div className="equation-box anim-fadeInUp" style={{ animationDelay: '0.2s', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--rb-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'Inter', fontWeight: 700 }}>
            Final Locker Code Equation
          </div>
          <div>
            {x} <span style={{ color: 'var(--rb-muted)' }}>+</span> {y} <span style={{ color: 'var(--rb-muted)' }}>=</span> <span style={{ color: 'var(--rb-red)' }}>?</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="card anim-fadeInUp" style={{ animationDelay: '0.25s', marginBottom: '1.5rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3>🔐 How to unlock the locker</h3>
            <span className="challenge-label" style={{ fontSize: '0.7rem', padding: '0.3rem 0.7rem' }}>⚡ SIG Challenge</span>
          </div>
          <ol style={{ listStyleType: 'decimal', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', color: 'var(--rb-silver)', fontSize: '0.95rem' }}>
            <li>
              Add your two collected values:&nbsp;
              <span style={{ color: 'var(--rb-yellow)', fontFamily: 'JetBrains Mono' }}>
                {x} + {y}
              </span>
            </li>
            <li>The result is your <strong style={{ color: 'var(--rb-text)' }}>4-digit locker code</strong></li>
            <li>Go to the physical locker and enter the code</li>
            <li><strong style={{ color: 'var(--rb-red)' }}>First team to unlock wins! 🏁</strong></li>
          </ol>
        </div>

        {/* Code Validator */}
        {canCalculate && (
          <div className="card anim-fadeInUp" style={{ animationDelay: '0.3s', marginBottom: '1.5rem', textAlign: 'left' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>🔢 Verify Your Answer</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              Calculate <span style={{ color: 'var(--rb-yellow)', fontFamily: 'JetBrains Mono' }}>{x} + {y}</span> and enter the result to verify before going to the locker.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                type="number"
                placeholder="Enter your calculated code"
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value); setValidated(null); }}
                onKeyDown={e => e.key === 'Enter' && handleValidate()}
              />
              <button className="btn btn-primary" onClick={handleValidate} disabled={!codeInput.trim()}>
                Check
              </button>
            </div>
            {validated === 'correct' && (
              <div className="alert alert-success anim-scaleIn" style={{ marginTop: '1rem' }}>
                ✅ Correct! The locker code is <strong style={{ fontFamily: 'JetBrains Mono' }}>{finalAnswer}</strong> — run to the locker now!
              </div>
            )}
            {validated === 'wrong' && (
              <div className="alert alert-error anim-scaleIn" style={{ marginTop: '1rem' }}>
                ❌ That's not right. Try recalculating: {x} + {y} = ?
              </div>
            )}
          </div>
        )}

        <button
          id="btn-play-again"
          className="btn btn-secondary"
          onClick={handlePlayAgain}
        >
          🔄 Back to Home
        </button>

        {/* Footer */}
        <div className="footer" style={{ marginTop: '2rem' }}>
          <div className="footer-text">Powered by SIG Reality Club</div>
        </div>
      </div>
    </div>
  );
}
