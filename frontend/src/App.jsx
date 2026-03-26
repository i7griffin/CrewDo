import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import ClanPage from './pages/ClanPage'

const SplashScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-bg-dark">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-neon border-t-transparent animate-spin" />
      <p className="font-display text-neon tracking-widest text-sm uppercase">Loading CrewDo</p>
    </div>
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#111811',
              color: '#e2e8e2',
              border: '1px solid rgba(57,255,20,0.2)',
              fontFamily: 'DM Sans',
            },
            success: { iconTheme: { primary: '#39ff14', secondary: '#0a0f0a' } },
          }}
        />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clan/:id" element={<ClanPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}