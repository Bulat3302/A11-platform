import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import SimulatorPage from './pages/SimulatorPage'
import ConstructorPage from './pages/ConstructorPage'
import LibraryPage from './pages/LibraryPage'
import PaletteDetailPage from './pages/PaletteDetailPage'
import CabinetPage from './pages/CabinetPage'
import ProjectPage from './pages/ProjectPage'


function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuth = useAuthStore(s => s.isAuth)
  return isAuth ? <>{children}</> : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/constructor" element={<ConstructorPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/:id" element={<PaletteDetailPage />} />
          <Route path="/cabinet" element={
            <PrivateRoute><CabinetPage /></PrivateRoute>
          } />
          <Route path="/cabinet/projects/:id" element={
            <PrivateRoute><ProjectPage /></PrivateRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}