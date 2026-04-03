import React, { createContext, useContext, useState } from 'react';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [role, setRole] = useState(null);        // 'participant' | 'organizer'
  const [teamId, setTeamId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [gameState, setGameState] = useState('LOGIN'); // LOGIN | WAITING | PLAYING | DONE
  const [currentStage, setCurrentStage] = useState(1);
  const [digits, setDigits] = useState([]);          // earned digits
  const [question, setQuestion] = useState(null);     // current question data

  const resetGame = () => {
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
