import React, { useEffect, useState } from 'react'
import AlertForm from './components/AlertForm'
import MapView from './components/MapView'
import AlertList from './components/AlertList'
import { LoginForm } from './components/LoginForm'
import { RegisterForm } from './components/RegisterForm'
import { AdminDashboard } from './components/AdminDashboard'
import { fetchAlerts } from './api'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function AppContent() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [showRegister, setShowRegister] = useState(false)
  const [selectedLat, setSelectedLat] = useState<number>()
  const [selectedLng, setSelectedLng] = useState<number>()
  const [mapClickEnabled, setMapClickEnabled] = useState(false)
  const [showAdminDashboard, setShowAdminDashboard] = useState(false)
  const { user, loading, logout } = useAuth()

  const handleMapClick = (lat: number, lng: number) => {
    if (mapClickEnabled) {
      setSelectedLat(lat)
      setSelectedLng(lng)
    }
  }

  const handleLocationSelectToggle = (enabled: boolean) => {
    setMapClickEnabled(enabled)
  }

  async function load() {
    try {
      const a = await fetchAlerts()
      setAlerts(a || [])
    } catch (err) {
      console.error('Failed to load alerts:', err)
    }
  }

  useEffect(() => {
    if (user) {
      load()
      const id = setInterval(load, 5000)
      return () => clearInterval(id)
    }
  }, [user])

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app">
        <header>
          <h1>alertNeighbourhood</h1>
        </header>
        <div className="auth-container">
          {showRegister ? (
            <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
          ) : (
            <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header>
        <h1>alertNeighbourhood</h1>
        <div className="user-info">
          <span>Welcome, {user.username}!</span>
          {user.isAdmin && (
            <button 
              onClick={() => setShowAdminDashboard(!showAdminDashboard)} 
              className="admin-btn"
            >
              {showAdminDashboard ? '🗺️ Map View' : '🛡️ Admin Panel'}
            </button>
          )}
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>
      {showAdminDashboard && user.isAdmin ? (
        <AdminDashboard />
      ) : (
        <div className="main">
          <div className="left">
            <AlertForm 
              onCreated={load} 
              onLocationSelectToggle={handleLocationSelectToggle}
              selectedLat={selectedLat}
              selectedLng={selectedLng}
            />
            <AlertList alerts={alerts} onRefresh={load} onSelect={(id:string)=>setSelectedAlertId(id)} />
          </div>
          <div className="right">
            <MapView 
              alerts={alerts} 
              selectedAlertId={selectedAlertId}
              onMapClick={handleMapClick}
              mapClickEnabled={mapClickEnabled}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
