import React, { useState } from 'react'
import { resolveAlert, deleteAlert } from '../api'

export default function AlertList({ alerts, onRefresh, onSelect }: { alerts: any[], onRefresh?: () => void, onSelect?: (id:string)=>void }) {
  const [showResolved, setShowResolved] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modalImage, setModalImage] = useState<string | null>(null)
  
  async function onResolve(id: string) {
    await resolveAlert(id)
    onRefresh?.()
  }

  async function onDelete(id: string) {
    if (!confirm('Are you sure you want to delete this alert?')) return
    
    setDeletingId(id)
    try {
      await deleteAlert(id)
      onRefresh?.()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete alert')
    } finally {
      setDeletingId(null)
    }
  }

  const activeAlerts = alerts.filter(a => !a.resolved)
  const resolvedAlerts = alerts.filter(a => a.resolved)

  const getRiskIcon = (risk: string) => {
    switch(risk) {
      case 'High': return '🔴'
      case 'Medium': return '🟠'
      case 'Low': return '🟢'
      default: return '⚪'
    }
  }

  const getRiskClass = (risk: string) => {
    switch(risk) {
      case 'High': return 'risk-high'
      case 'Medium': return 'risk-medium'
      case 'Low': return 'risk-low'
      default: return 'risk-unknown'
    }
  }

  return (
    <div className="alerts-container">
      {activeAlerts.length > 0 && (
        <div className="alerts-section">
          <h3>🚨 Active Alerts ({activeAlerts.length})</h3>
          {activeAlerts.map(a => (
            <div key={a.id} className={`alert-item ${getRiskClass(a.risk)}`} onClick={()=>onSelect?.(a.id)}>
              <div className="alert-header">
                <span className="alert-title">{getRiskIcon(a.risk)} {a.title}</span>
                <span className={`alert-badge ${getRiskClass(a.risk)}`}>{a.risk}</span>
              </div>
              {a.username && <div className="alert-author">👤 {a.username}</div>}
              <div className="alert-description">{a.description}</div>
              {a.image && (
                <div className="alert-image-container">
                  <img 
                    src={`http://localhost:4000${a.image}`} 
                    alt="Alert evidence" 
                    className="alert-image"
                    onClick={(e) => { e.stopPropagation(); setModalImage(`http://localhost:4000${a.image}`); }}
                  />
                </div>
              )}
              {a.reason && <div className="alert-reason">💡 {a.reason}</div>}
              <div className="alert-actions">
                <button className="resolve-btn" onClick={(e)=>{ e.stopPropagation(); onResolve(a.id)}}>
                  ✓ Mark Resolved
                </button>
                <button 
                  className="delete-btn" 
                  onClick={(e)=>{ e.stopPropagation(); onDelete(a.id)}}
                  disabled={deletingId === a.id}
                >
                  {deletingId === a.id ? '⏳ Deleting...' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolvedAlerts.length > 0 && (
        <div className="alerts-section resolved-section">
          <h3 onClick={() => setShowResolved(!showResolved)} style={{ cursor: 'pointer', userSelect: 'none' }}>
            {showResolved ? '▼' : '▶'} ✅ Resolved Alerts ({resolvedAlerts.length})
          </h3>
          {showResolved && resolvedAlerts.map(a => (
            <div key={a.id} className="alert-item alert-resolved" onClick={()=>onSelect?.(a.id)}>
              <div className="alert-header">
                <span className="alert-title">⚫ {a.title}</span>
                <span className="alert-badge resolved">Resolved</span>
              </div>
              {a.username && <div className="alert-author">👤 {a.username}</div>}
              <div className="alert-description">{a.description}</div>
              {a.image && (
                <div className="alert-image-container">
                  <img 
                    src={`http://localhost:4000${a.image}`} 
                    alt="Alert evidence" 
                    className="alert-image"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      console.log('Image path from server:', a.image)
                      console.log('Full URL:', `http://localhost:4000${a.image}`)
                      setModalImage(`http://localhost:4000${a.image}`); 
                    }}
                    onError={(e) => {
                      console.error('❌ Image failed to load!')
                      console.error('Image path:', a.image)
                      console.error('Tried URL:', `http://localhost:4000${a.image}`)
                      e.currentTarget.style.border = '2px solid red'
                      e.currentTarget.alt = 'Failed to load image - check console'
                    }}
                  />
                  <p style={{fontSize: '10px', color: '#999', marginTop: '4px'}}>
                    Path: {a.image}
                  </p>
                </div>
              )}
              <div className="alert-actions">
                <button 
                  className="delete-btn" 
                  onClick={(e)=>{ e.stopPropagation(); onDelete(a.id)}}
                  disabled={deletingId === a.id}
                >
                  {deletingId === a.id ? '⏳ Deleting...' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {alerts.length === 0 && (
        <div className="no-alerts">
          <p>📭 No alerts yet</p>
          <p className="no-alerts-hint">Create your first alert to get started!</p>
        </div>
      )}

      {modalImage && (
        <div className="image-modal" onClick={() => setModalImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={() => setModalImage(null)}>✕</button>
            <img src={modalImage} alt="Alert evidence fullsize" />
          </div>
        </div>
      )}
    </div>
  )
}
