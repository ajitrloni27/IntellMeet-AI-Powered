import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import MeetingRoom from './pages/MeetingRoom'
import LobbyPage from './pages/LobbyPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  // Authentication disabled – always allow access
  return <>{children}</>
}

import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/lobby/:roomId" element={<LobbyPage />} />
        <Route path="/room/:roomId" element={<MeetingRoom />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
