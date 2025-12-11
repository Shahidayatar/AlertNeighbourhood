import React, { useState } from 'react'
import { createAlert } from '../api'

interface AlertFormProps {
  onCreated?: () => void;
  onLocationSelectToggle?: (enabled: boolean) => void;
  selectedLat?: number;
  selectedLng?: number;
}

export default function AlertForm({ onCreated, onLocationSelectToggle, selectedLat, selectedLng }: AlertFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState('46.9480')
  const [lng, setLng] = useState('7.4474')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectingLocation, setSelectingLocation] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  // Update coordinates when map location is selected
  React.useEffect(() => {
    if (selectedLat !== undefined && selectedLng !== undefined && selectingLocation) {
      setLat(selectedLat.toFixed(4))
      setLng(selectedLng.toFixed(4))
    }
  }, [selectedLat, selectedLng, selectingLocation])

  const toggleLocationSelect = () => {
    const newState = !selectingLocation
    setSelectingLocation(newState)
    onLocationSelectToggle?.(newState)
  }

  const startCamera = async () => {
    console.log('🎥 START CAMERA FUNCTION CALLED')
    
    try {
      console.log('Requesting camera access...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true
      })
      console.log('✅ Camera stream received:', stream.active)
      
      streamRef.current = stream
      setShowCamera(true)
      
      // Small delay to ensure state is updated and video element is rendered
      setTimeout(() => {
        console.log('Setting video source...')
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current
          console.log('Video source set, attempting play...')
          videoRef.current.play()
            .then(() => {
              console.log('✅ Video is playing!')
              setCameraLoading(false)
            })
            .catch(err => {
              console.error('❌ Play failed:', err)
              setCameraLoading(false)
            })
        } else {
          console.error('❌ Video ref or stream ref is null', {
            videoRef: videoRef.current,
            streamRef: streamRef.current
          })
          setCameraLoading(false)
        }
      }, 200)
      
    } catch (err: any) {
      console.error('❌ Camera error:', err)
      alert(`Camera error: ${err.message}`)
      setCameraLoading(false)
      setShowCamera(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setShowCamera(false)
    setCameraLoading(false)
    setCapturedPhoto(null)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(videoRef.current, 0, 0)
    const photoData = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedPhoto(photoData)
  }

  const confirmPhoto = () => {
    if (!capturedPhoto || !canvasRef.current) return
    
    canvasRef.current.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
      setImage(file)
      setImagePreview(capturedPhoto)
      setCapturedPhoto(null)
      stopCamera()
    }, 'image/jpeg', 0.9)
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  // Cleanup camera on unmount
  React.useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

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
      setImagePreview(null)
      setCapturedPhoto(null)
      onCreated?.()
    } finally { setLoading(false) }
  }

  return (
    <form className="alert-form" onSubmit={submit}>
      <h2>Create Alert</h2>
      <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} required />
      <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} required />
      <div className="location-group">
        <label>
          Latitude 
          <input value={lat} onChange={e=>setLat(e.target.value)} required />
        </label>
        <label>
          Longitude 
          <input value={lng} onChange={e=>setLng(e.target.value)} required />
        </label>
      </div>
      <button 
        type="button" 
        className={`select-location-btn ${selectingLocation ? 'active' : ''}`}
        onClick={toggleLocationSelect}
      >
        {selectingLocation ? '📍 Click on map to select location...' : '🗺️ Select Location on Map'}
      </button>
      
      {showCamera ? (
        <div className="camera-container">
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {cameraLoading ? (
            <div className="camera-loading">
              <p>📷 Opening camera...</p>
              <p style={{ fontSize: '12px', opacity: 0.7 }}>Please allow camera access if prompted</p>
              <button 
                type="button" 
                className="camera-btn cancel" 
                onClick={stopCamera}
                style={{ marginTop: '20px' }}
              >
                ❌ Cancel
              </button>
            </div>
          ) : capturedPhoto ? (
            <>
              <img src={capturedPhoto} alt="Captured" className="camera-preview" />
              <div className="camera-controls three-buttons">
                <button type="button" className="camera-btn confirm" onClick={confirmPhoto}>
                  ✅ Confirm
                </button>
                <button type="button" className="camera-btn retake" onClick={retakePhoto}>
                  🔄 Retake
                </button>
                <button type="button" className="camera-btn cancel" onClick={stopCamera}>
                  ❌ Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="camera-preview" />
              <div className="camera-controls">
                <button type="button" className="camera-btn capture" onClick={capturePhoto}>
                  📸 Capture Photo
                </button>
                <button type="button" className="camera-btn cancel" onClick={stopCamera}>
                  ❌ Cancel
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {imagePreview ? (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <button type="button" className="remove-image-btn" onClick={removeImage}>
                ❌ Remove Image
              </button>
            </div>
          ) : (
            <div className="image-upload-options">
              <label className="upload-btn file-upload">
                📁 Choose File
                <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
              </label>
              <button type="button" className="upload-btn camera-upload" onClick={startCamera}>
                📷 Take Photo
              </button>
            </div>
          )}
        </>
      )}
      
      <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Alert'}</button>
    </form>
  )
}
