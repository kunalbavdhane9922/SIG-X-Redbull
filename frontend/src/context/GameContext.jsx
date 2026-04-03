import React, { createContext, useContext, useState, useEffect } from 'react';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  // Load initial state from localStorage
  const loadState = (key, def) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : def;
    } catch {
      return def;
    }
  };

  const [role, setRole] = useState(() => loadState('sig_role', null));
  const [teamId, setTeamId] = useState(() => loadState('sig_teamId', ''));
  const [roomId, setRoomId] = useState(() => loadState('sig_roomId', ''));
  const [organizer, setOrganizer] = useState(() => loadState('sig_organizer', ''));
  
  const [gameState, setGameState] = useState('LOGIN'); // LOGIN | WAITING | PLAYING | DONE
  const [currentStage, setCurrentStage] = useState(1);
  const [digits, setDigits] = useState([]);          // earned digits
  const [question, setQuestion] = useState(null);     // current question data

  // Persist state to localStorage on change
  useEffect(() => {
    localStorage.setItem('sig_role', JSON.stringify(role));
    localStorage.setItem('sig_teamId', JSON.stringify(teamId));
    localStorage.setItem('sig_roomId', JSON.stringify(roomId));
    localStorage.setItem('sig_organizer', JSON.stringify(organizer));
  }, [role, teamId, roomId, organizer]);

  const resetGame = () => {
    localStorage.removeItem('sig_role');
    localStorage.removeItem('sig_teamId');
    localStorage.removeItem('sig_roomId');
    localStorage.removeItem('sig_organizer');
    setRole(null);
    setTeamId('');
    setRoomId('');
    setOrganizer('');
    setGameState('LOGIN');
    setCurrentStage(1);
    setDigits([]);
    setQuestion(null);
  };

  return (
    <GameContext.Provider value={{
      role, setRole,
      teamId, setTeamId,
      roomId, setRoomId,
      organizer, setOrganizer,
      gameState, setGameState,
      currentStage, setCurrentStage,
      digits, setDigits,
      question, setQuestion,
      resetGame,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
