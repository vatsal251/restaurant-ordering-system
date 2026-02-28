import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function SealDispatch() {
    const { id: orderId } = useParams()
    const navigate = useNavigate()
    const [preview, setPreview] = useState(null)
    const [step, setStep] = useState('capture') // 'capture' | 'confirm' | 'done'
    const [loading, setLoading] = useState(false)
    const [isCameraOpen, setIsCameraOpen] = useState(false)
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)

    useEffect(() => {
        if (isCameraOpen && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current
        }
    }, [isCameraOpen])

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            streamRef.current = stream
            setIsCameraOpen(true)
        } catch (err) {
            console.warn('Camera access denied or failed.', err)
            alert('Camera access denied or failed.')
        }
    }


    const handleFileUpload = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const dataUrl = event.target.result
            setPreview(dataUrl)
            // Stop camera if it happened to be running
            streamRef.current?.getTracks().forEach(t => t.stop())
            setIsCameraOpen(false)
            setStep('confirm')
        }
        reader.readAsDataURL(file)
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
        setIsCameraOpen(false)
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
        } catch (error) {
            console.error('Upload error:', error)
            alert(`Upload failed: ${error.response?.data?.message || error.message}. Please try again.`)
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

                {!isCameraOpen ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-4 p-6">
                            <div className="text-6xl">📸</div>
                            <h2 className="text-white text-xl font-bold">Ready to photograph?</h2>
                            <p className="text-gray-400 text-sm">Take a clear photo of the sealed container before dispatching</p>
                            <button id="open-camera-btn" onClick={startCamera} className="btn-primary w-full">Open Camera</button>

                            {/* Fallback File Upload before camera opens */}
                            <div className="text-center mt-4">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="seal-upload-restaurant-initial"
                                />
                                <label
                                    htmlFor="seal-upload-restaurant-initial"
                                    className="btn-outline w-full cursor-pointer inline-block"
                                >
                                    Upload from Gallery
                                </label>
                            </div>
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
                        <div className="p-6 bg-black flex flex-col items-center gap-4">
                            <div className="flex items-center gap-6">
                                <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setIsCameraOpen(false); }} className="text-gray-400 hover:text-white px-2 py-2">Close</button>
                                <button id="capture-btn" onClick={capturePhoto}
                                    className="w-20 h-20 rounded-full bg-white border-4 border-brand-500 active:scale-95 transition-transform" />
                                <div className="w-10"></div> {/* Spacer for centering */}
                            </div>

                            {/* Fallback File Upload */}
                            <div className="text-center">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="seal-upload-restaurant"
                                />
                                <label
                                    htmlFor="seal-upload-restaurant"
                                    className="text-gray-400 text-sm cursor-pointer underline hover:text-white"
                                >
                                    Or upload a photo from gallery
                                </label>
                            </div>
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
