import React, { useEffect, useState } from 'react'
import AlertForm from './components/AlertForm'
import MapView from './components/MapView'
import AlertList from './components/AlertList'
import { fetchAlerts } from './api'

export default function App() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)

  async function load() {
    const a = await fetchAlerts()
    setAlerts(a || [])
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="app">
      <header>
        <h1>alertNeighbourhood</h1>
      </header>
      <div className="main">
        <div className="left">
          <AlertForm onCreated={load} />
          <AlertList alerts={alerts} onRefresh={load} onSelect={(id:string)=>setSelectedAlertId(id)} />
        </div>
        <div className="right">
          <MapView alerts={alerts} selectedAlertId={selectedAlertId} />
        </div>
      </div>
    </div>
  )
}
