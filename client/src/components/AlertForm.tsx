import React, { useState } from 'react'
import { createAlert } from '../api'

export default function AlertForm({ onCreated }: { onCreated?: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState('47.3769')
  const [lng, setLng] = useState('8.5417')
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('title', title)
      fd.append('description', description)
      fd.append('lat', lat)
      fd.append('lng', lng)
      if (image) fd.append('image', image)
      await createAlert(fd)
      setTitle('')
      setDescription('')
      setImage(null)
      onCreated?.()
    } finally { setLoading(false) }
  }

  return (
    <form className="alert-form" onSubmit={submit}>
      <h2>Create Alert</h2>
      <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
      <label>Latitude <input value={lat} onChange={e=>setLat(e.target.value)} /></label>
      <label>Longitude <input value={lng} onChange={e=>setLng(e.target.value)} /></label>
      <input type="file" accept="image/*" onChange={e=>setImage(e.target.files?.[0]||null)} />
      <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Alert'}</button>
    </form>
  )
}
