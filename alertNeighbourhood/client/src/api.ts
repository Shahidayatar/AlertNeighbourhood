import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export async function fetchAlerts() {
  const res = await axios.get(`${API_BASE}/api/alerts`)
  return res.data
}

export async function createAlert(formData: FormData) {
  const res = await axios.post(`${API_BASE}/api/alerts`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export async function resolveAlert(id: string) {
  const res = await axios.post(`${API_BASE}/api/alerts/${id}/resolve`)
  return res.data
}
