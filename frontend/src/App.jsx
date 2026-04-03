import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WebSocketProvider } from './context/WebSocketContext';
import { GameProvider, useGame } from './context/GameContext';
import LoginPage from './pages/LoginPage';
import WaitingRoom from './pages/WaitingRoom';
import OrganizerDashboard from './pages/OrganizerDashboard';
import GamePage from './pages/GamePage';
import CompletionPage from './pages/CompletionPage';

function GuardedRoute({ element, requiredRole }) {
  const { role } = useGame();
  
  // If role is null but we're trying to access a guarded route, redirect to login
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return element;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/waiting"    element={<GuardedRoute element={<WaitingRoom />}         requiredRole="participant" />} />
      <Route path="/game"       element={<GuardedRoute element={<GamePage />}            requiredRole="participant" />} />
      <Route path="/completion" element={<GuardedRoute element={<CompletionPage />}      requiredRole="participant" />} />
      <Route path="/organizer"  element={<GuardedRoute element={<OrganizerDashboard />} requiredRole="organizer"  />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <WebSocketProvider>
          <AppRoutes />
        </WebSocketProvider>
      </GameProvider>
    </BrowserRouter>
  );
}
