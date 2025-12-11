import React, { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapViewProps {
  alerts: any[];
  selectedAlertId?: string | null;
  onMapClick?: (lat: number, lng: number) => void;
  mapClickEnabled?: boolean;
}

export default function MapView({ alerts, selectedAlertId, onMapClick, mapClickEnabled }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const tempMarkerRef = useRef<L.Marker | null>(null)
  const clickHandlerRef = useRef<((e: L.LeafletMouseEvent) => void) | null>(null)

  useEffect(() => {
    if (!mapRef.current) {
      // init map once - centered on Bern, Switzerland
      mapRef.current = L.map('map', { center: [46.9480, 7.4474], zoom: 13 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current)
    }
  }, [])

  // Separate effect for map click handling
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove previous click handler if exists
    if (clickHandlerRef.current) {
      map.off('click', clickHandlerRef.current)
    }

    // Only add click handler when mapClickEnabled is true
    if (mapClickEnabled && onMapClick) {
      const handler = (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        onMapClick(lat, lng)
        
        // Remove previous temp marker if exists
        if (tempMarkerRef.current) {
          tempMarkerRef.current.remove()
        }
        
        // Add temporary marker to show selected location
        const icon = L.divIcon({ 
          className: 'custom-marker', 
          html: `<div class="marker-pin temp-marker" style="background:#667eea">
                   <div class="marker-inner"></div>
                 </div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
        tempMarkerRef.current = L.marker([lat, lng], { icon }).addTo(map)
        tempMarkerRef.current.bindPopup(`📍 Selected location<br/>Lat: ${lat.toFixed(4)}<br/>Lng: ${lng.toFixed(4)}`).openPopup()
      }
      
      clickHandlerRef.current = handler
      map.on('click', handler)
      map.getContainer().style.cursor = 'crosshair'
    } else {
      map.getContainer().style.cursor = ''
      // Remove temp marker when location selection is disabled
      if (tempMarkerRef.current) {
        tempMarkerRef.current.remove()
        tempMarkerRef.current = null
      }
    }

    return () => {
      if (clickHandlerRef.current) {
        map.off('click', clickHandlerRef.current)
        map.getContainer().style.cursor = ''
      }
    }
  }, [mapClickEnabled, onMapClick])

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
      const color = a.resolved ? '#888' : (a.risk === 'High' ? '#e74c3c' : a.risk === 'Medium' ? '#f39c12' : '#27ae60')
      const pulseClass = (!a.resolved && a.risk === 'High') ? 'pulse-marker' : ''
      const icon = L.divIcon({ 
        className: 'custom-marker', 
        html: `<div class="marker-pin ${pulseClass}" style="background:${color}">
                 <div class="marker-inner"></div>
               </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
      const lat = Number(a.lat) || 46.9480
      const lng = Number(a.lng) || 7.4474

      const popupContent = `
        <div class="alert-popup">
          <div class="popup-header" style="background:${color}">
            <strong>${a.title}</strong>
            <span class="risk-badge">${a.risk || 'Unknown'}</span>
          </div>
          <div class="popup-body">
            <p>${a.description}</p>
            ${a.reason ? `<p class="popup-reason"><em>📊 ${a.reason}</em></p>` : ''}
            ${a.username ? `<p class="popup-author">👤 Reported by: ${a.username}</p>` : ''}
            ${a.resolved ? '<p class="popup-resolved">✅ Resolved</p>' : ''}
            ${a.analysisSource ? `<p class="popup-source">🤖 AI: ${a.analysisSource}</p>` : ''}
          </div>
        </div>
      `
      
      if (existing.has(a.id)) {
        const m = existing.get(a.id)!
        m.setLatLng([lat, lng])
        m.setIcon(icon)
        m.setPopupContent(popupContent)
      } else {
        const marker = L.marker([lat, lng], { icon }).addTo(map)
        marker.bindPopup(popupContent)
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
