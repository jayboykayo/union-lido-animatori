import MappaPage from './pages/MappaPage'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import CambioPasswordPage from './pages/CambioPasswordPage'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import ProgrammaPage from './pages/ProgrammaPage'
import ChatPage from './pages/ChatPage'
import CucinaPage from './pages/CucinaPage'
import RubricaPage from './pages/RubricaPage'
import AnnunciPage from './pages/AnnunciPage'
import CompleanniPage from './pages/CompleanniPage'
import ProfiloPage from './pages/ProfiloPage'
import ModeratorePanel from './pages/ModeratorePanel'
import LoadingSpinner from './components/layout/LoadingSpinner'

function PrivateRoute({ children }) {
  const { isAuthenticated, loading, primoAccesso } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (primoAccesso) return <Navigate to="/cambia-password" replace />
  return children
}

function ModeratorRoute({ children }) {
  const { isModerator, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!isModerator) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { isAuthenticated, loading, primoAccesso } = useAuth()

  if (loading) return <LoadingSpinner />

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated && !primoAccesso ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/cambia-password"
        element={!isAuthenticated ? <Navigate to="/login" replace /> : <CambioPasswordPage />}
      />

      {/* Route protette con layout */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="programma" element={<ProgrammaPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="cucina" element={<CucinaPage />} />
        <Route path="rubrica" element={<RubricaPage />} />
        <Route path="annunci" element={<AnnunciPage />} />
        <Route path="compleanni" element={<CompleanniPage />} />
        <Route path="mappa" element={<MappaPage />} />
        <Route path="profilo" element={<ProfiloPage />} />
        <Route
          path="moderatore"
          element={
            <ModeratorRoute>
              <ModeratorePanel />
            </ModeratorRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
