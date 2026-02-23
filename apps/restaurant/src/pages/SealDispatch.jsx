import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function SealDispatch() {
    const { id: orderId } = useParams()
    const navigate = useNavigate()
    const [preview, setPreview] = useState(null)
    const [step, setStep] = useState('capture') // 'capture' | 'confirm' | 'done'
    const [loading, setLoading] = useState(false)
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            streamRef.current = stream
            if (videoRef.current) videoRef.current.srcObject = stream
        } catch {
            alert('Camera access denied.')
        }
    }

    const capturePhoto = () => {
        const canvas = canvasRef.current
        const video = videoRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setPreview(dataUrl)
        streamRef.current?.getTracks().forEach(t => t.stop())
        setStep('confirm')
    }

    const submitPhoto = async () => {
        setLoading(true)
        try {
            const res = await fetch(preview)
            const blob = await res.blob()
            const formData = new FormData()
            formData.append('photo', blob, 'dispatch-seal.jpg')
            await api.post(`/api/seal/${orderId}/dispatch`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setStep('done')
        } catch {
            alert('Upload failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (step === 'capture') {
        return (
            <div className="min-h-screen bg-black flex flex-col">
                <div className="flex items-center gap-3 p-4 bg-black/80">
                    <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); navigate(-1) }}
                        className="text-white text-xl">←</button>
                    <div>
                        <h1 className="text-white font-semibold">Dispatch Seal Photo</h1>
                        <p className="text-gray-400 text-xs">Order #{orderId} — Photograph the sealed package before handing to rider</p>
                    </div>
                </div>

                {!streamRef.current?.active ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-4 p-6">
                            <div className="text-6xl">📸</div>
                            <h2 className="text-white text-xl font-bold">Ready to photograph?</h2>
                            <p className="text-gray-400 text-sm">Take a clear photo of the sealed container before dispatching</p>
                            <button id="open-camera-btn" onClick={startCamera} className="btn-primary">Open Camera</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 relative">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-72 h-72 border-2 border-brand-500 rounded-2xl opacity-70" />
                            </div>
                        </div>
                        <div className="p-6 bg-black flex justify-center">
                            <button id="capture-btn" onClick={capturePhoto}
                                className="w-20 h-20 rounded-full bg-white border-4 border-brand-500 active:scale-95 transition-transform" />
                        </div>
                    </>
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>
        )
    }

    if (step === 'confirm') {
        return (
            <div className="min-h-screen p-4 space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-1">Confirm Dispatch Photo</h1>
                    <p className="text-gray-400 text-sm">Make sure the seal is clearly visible in the photo</p>
                </div>
                <div className="rounded-2xl overflow-hidden border border-white/10 aspect-square">
                    <img src={preview} alt="dispatch seal preview" className="w-full h-full object-cover" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button id="retake-btn" onClick={() => { setPreview(null); setStep('capture'); startCamera() }}
                        className="btn-outline w-full">
                        Retake
                    </button>
                    <button id="confirm-dispatch-btn" onClick={submitPhoto} disabled={loading}
                        className="btn-primary w-full disabled:opacity-50">
                        {loading ? 'Uploading…' : '✅ Confirm & Dispatch'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full card space-y-6 text-center">
                <div className="text-6xl">✅</div>
                <h1 className="text-2xl font-bold text-brand-500">Seal Photo Saved!</h1>
                <p className="text-gray-400">The dispatch photo has been recorded for Order #{orderId}. You can now hand over to the delivery partner.</p>
                <button id="done-btn" onClick={() => navigate('/orders')} className="btn-primary w-full">
                    Back to Orders
                </button>
            </div>
        </div>
    )
}
