import { useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function SealVerify() {
    const { id: orderId } = useParams()
    const navigate = useNavigate()

    const [dispatchPhoto, setDispatchPhoto] = useState(null)
    const [customerPhoto, setCustomerPhoto] = useState(null)
    const [preview, setPreview] = useState(null)
    const [verdict, setVerdict] = useState(null) // 'intact' | 'suspicious' | 'tampered'
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState('view') // 'view' | 'capture' | 'compare' | 'done'
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)

    // Load dispatch photo from API on mount
    const loadDispatchPhoto = useCallback(async () => {
        try {
            const { data } = await api.get(`/api/seal/${orderId}/compare`)
            setDispatchPhoto(data.dispatch_photo_url)
            setStep('capture')
        } catch {
            setDispatchPhoto(null)
            setStep('capture')
        }
    }, [orderId])

    const startCamera = async () => {
        await loadDispatchPhoto()
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            streamRef.current = stream
            if (videoRef.current) videoRef.current.srcObject = stream
        } catch {
            alert('Camera access denied. Please allow camera permission.')
        }
    }

    const capturePhoto = () => {
        const canvas = canvasRef.current
        const video = videoRef.current
        if (!canvas || !video) return
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setPreview(dataUrl)
        setCustomerPhoto(dataUrl)
        // Stop camera
        streamRef.current?.getTracks().forEach(t => t.stop())
        setStep('compare')
    }

    const submitVerdict = async (v) => {
        setVerdict(v)
        setLoading(true)
        try {
            // Convert dataURL to blob
            const res = await fetch(customerPhoto)
            const blob = await res.blob()
            const formData = new FormData()
            formData.append('photo', blob, 'seal.jpg')
            await api.post(`/api/seal/${orderId}/customer`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            await api.post(`/api/seal/${orderId}/dispute`, { verdict: v })
            setStep('done')
        } catch {
            setStep('done')
        } finally {
            setLoading(false)
        }
    }

    // STEP: Initial prompt
    if (step === 'view') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full card space-y-6 text-center">
                    <div className="text-5xl">🔒</div>
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Seal Verification</h1>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            We'd like you to take a quick photo of your package to verify the seal is intact.
                            You'll then compare it with the restaurant's dispatch photo.
                        </p>
                    </div>
                    <button id="start-seal-verify" onClick={startCamera} className="btn-primary w-full">
                        📷 Open Camera
                    </button>
                    <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-300">
                        Skip for now
                    </button>
                </div>
            </div>
        )
    }

    // STEP: Camera capture
    if (step === 'capture') {
        return (
            <div className="min-h-screen bg-black flex flex-col">
                <div className="flex items-center gap-3 p-4 bg-black/80">
                    <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); navigate(-1) }}
                        className="text-white text-xl">←</button>
                    <h1 className="text-white font-semibold">Take a photo of the package seal</h1>
                </div>
                <div className="flex-1 relative">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    {/* Overlay guide frame */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-72 h-72 border-2 border-brand-500 rounded-2xl opacity-70" />
                    </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <div className="p-6 bg-black flex justify-center">
                    <button
                        id="capture-btn"
                        onClick={capturePhoto}
                        className="w-20 h-20 rounded-full bg-white border-4 border-brand-500 active:scale-95 transition-transform"
                    />
                </div>
            </div>
        )
    }

    // STEP: Side-by-side comparison
    if (step === 'compare') {
        return (
            <div className="min-h-screen p-4 space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-1">Compare the Seals</h1>
                    <p className="text-gray-400 text-sm">Check if the packaging looks the same as when it was dispatched</p>
                </div>

                {/* Side-by-side photos */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <p className="text-xs text-gray-400 text-center font-medium uppercase tracking-wide">
                            🏪 Restaurant Sent
                        </p>
                        <div className="aspect-square rounded-2xl overflow-hidden bg-[#1a1a1a] border border-white/10">
                            {dispatchPhoto
                                ? <img src={dispatchPhoto} alt="dispatch seal" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">No photo</div>
                            }
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs text-gray-400 text-center font-medium uppercase tracking-wide">
                            📦 You Received
                        </p>
                        <div className="aspect-square rounded-2xl overflow-hidden bg-[#1a1a1a] border border-white/10">
                            {preview && <img src={preview} alt="received seal" className="w-full h-full object-cover" />}
                        </div>
                    </div>
                </div>

                {/* Verdict buttons */}
                <div className="space-y-3">
                    <p className="text-sm text-gray-400 text-center font-medium">What do you think?</p>
                    <button
                        id="verdict-intact"
                        onClick={() => submitVerdict('intact')}
                        disabled={loading}
                        className="w-full py-4 rounded-2xl bg-green-500/10 border border-green-500/40 text-green-400 font-semibold text-lg hover:bg-green-500/20 transition-colors active:scale-95 disabled:opacity-50"
                    >
                        ✅ Seal looks intact
                    </button>
                    <button
                        id="verdict-suspicious"
                        onClick={() => submitVerdict('suspicious')}
                        disabled={loading}
                        className="w-full py-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 font-semibold text-lg hover:bg-yellow-500/20 transition-colors active:scale-95 disabled:opacity-50"
                    >
                        ⚠️ Looks suspicious
                    </button>
                    <button
                        id="verdict-tampered"
                        onClick={() => submitVerdict('tampered')}
                        disabled={loading}
                        className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-400 font-semibold text-lg hover:bg-red-500/20 transition-colors active:scale-95 disabled:opacity-50"
                    >
                        ❌ Seal is broken / tampered
                    </button>
                </div>

                <button onClick={() => { setStep('capture'); setPreview(null) }}
                    className="w-full text-sm text-gray-500 hover:text-gray-300 py-2">
                    Retake photo
                </button>
            </div>
        )
    }

    // STEP: Done
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full card space-y-6 text-center">
                {verdict === 'intact' && <>
                    <div className="text-6xl">✅</div>
                    <h1 className="text-2xl font-bold text-green-400">Seal Verified!</h1>
                    <p className="text-gray-400">Great! Your food seal is intact. Enjoy your meal!</p>
                </>}
                {verdict === 'suspicious' && <>
                    <div className="text-6xl">⚠️</div>
                    <h1 className="text-2xl font-bold text-yellow-400">Flagged as Suspicious</h1>
                    <p className="text-gray-400">We've recorded this. Our team will review the photos and contact you.</p>
                </>}
                {verdict === 'tampered' && <>
                    <div className="text-6xl">🚨</div>
                    <h1 className="text-2xl font-bold text-red-400">Dispute Raised</h1>
                    <p className="text-gray-400">We're sorry! A dispute has been raised. Our team will review and initiate a refund if confirmed.</p>
                </>}
                <button id="done-btn" onClick={() => navigate('/')} className="btn-primary w-full">
                    Back to Home
                </button>
            </div>
        </div>
    )
}
