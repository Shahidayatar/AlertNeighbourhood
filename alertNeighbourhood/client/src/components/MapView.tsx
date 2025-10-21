import React, { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function MapView({ alerts, selectedAlertId }: { alerts: any[], selectedAlertId?: string | null }) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  useEffect(() => {
    if (!mapRef.current) {
      // init map once
      mapRef.current = L.map('map', { center: [47.3769, 8.5417], zoom: 13 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // update markers: add/update/remove
    const existing = markersRef.current
    const incomingIds = new Set(alerts.map(a => a.id))

    // remove markers that no longer exist
    for (const id of Array.from(existing.keys())) {
      if (!incomingIds.has(id)) {
        existing.get(id)!.remove()
        existing.delete(id)
      }
    }

    // add or update markers
    alerts.forEach(a => {
      const color = a.resolved ? 'gray' : (a.risk === 'High' ? 'red' : a.risk === 'Medium' ? 'orange' : 'green')
      const icon = L.divIcon({ className: 'custom-pin', html: `<span style="background:${color};width:14px;height:14px;display:inline-block;border-radius:50%"></span>` })
      const lat = Number(a.lat) || 47.3769
      const lng = Number(a.lng) || 8.5417

      if (existing.has(a.id)) {
        const m = existing.get(a.id)!
        m.setLatLng([lat, lng])
        m.setIcon(icon)
        m.setPopupContent(`<b>${a.title}</b><br/>${a.description}<br/><i>${a.reason || ''}</i>${a.analysisSource ? `<br/><small>predicted by: ${a.analysisSource}</small>` : ''}`)
      } else {
        const marker = L.marker([lat, lng], { icon }).addTo(map)
        marker.bindPopup(`<b>${a.title}</b><br/>${a.description}<br/><i>${a.reason || ''}</i>${a.analysisSource ? `<br/><small>predicted by: ${a.analysisSource}</small>` : ''}`)
        existing.set(a.id, marker)
      }
    })

    // if a selection is provided, pan to it and open popup
    if (selectedAlertId) {
      const sel = existing.get(selectedAlertId)
      if (sel) {
        map.setView(sel.getLatLng(), 15, { animate: true })
        sel.openPopup()
      }
    }

    // do not remove map on cleanup — keep it persistent for user panning
    return () => {}
  }, [alerts, selectedAlertId])

  return <div id="map" className="map"></div>
}
