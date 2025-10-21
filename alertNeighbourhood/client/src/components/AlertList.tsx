import React from 'react'
import { resolveAlert } from '../api'

export default function AlertList({ alerts, onRefresh, onSelect }: { alerts: any[], onRefresh?: () => void, onSelect?: (id:string)=>void }) {
  async function onResolve(id: string) {
    await resolveAlert(id)
    onRefresh?.()
  }

  return (
    <div>
      <h3>Alerts</h3>
      {alerts.map(a => (
        <div key={a.id} className="alert-item" onClick={()=>onSelect?.(a.id)} style={{cursor:'pointer'}}>
          <b>{a.title}</b> <small>{a.risk}</small>
          <div>{a.description}</div>
          <div><i>{a.reason}</i></div>
          {!a.resolved ? <button onClick={(e)=>{ e.stopPropagation(); onResolve(a.id)}}>Resolve</button> : <em>Resolved</em>}
        </div>
      ))}
    </div>
  )
}
