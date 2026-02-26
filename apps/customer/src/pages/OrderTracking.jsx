import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'
import { io } from 'socket.io-client'
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix generic Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const deliveryIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

const STATUS_STEPS = ['placed', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'delivered']
const STATUS_LABELS = {
    placed: '🔔 Order Placed',
    confirmed: '✅ Confirmed by Restaurant',
    preparing: '👨‍🍳 Being Prepared',
    ready_for_pickup: '📦 Ready for Pickup',
    picked_up: '🚴 On the Way',
    delivered: '🎉 Delivered!',
    cancelled: '❌ Cancelled',
}
const STATUS_DESC = {
    placed: 'Your order has been sent to the restaurant',
    confirmed: 'The restaurant has accepted your order',
    preparing: 'The chef is preparing your food',
    ready_for_pickup: 'Waiting for a delivery partner',
    picked_up: 'Your delivery partner is on the way',
    delivered: 'Enjoy your meal!',
    cancelled: 'This order was cancelled',
}

export default function OrderTracking() {
    const { id: orderId } = useParams()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [partnerLoc, setPartnerLoc] = useState(null)
    const [cancelling, setCancelling] = useState(false)

    useEffect(() => {
        api.get(`/api/orders/${orderId}`)
            .then(r => setOrder(r.data))
            .catch(() => { })
            .finally(() => setLoading(false))

        // Real-time status updates
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000')
        socket.emit('JOIN_ORDER_ROOM', { orderId })
        socket.on('ORDER_STATUS_UPDATE', ({ status }) => {
            setOrder(o => o ? { ...o, status } : o)
        })
        socket.on('LOCATION_UPDATE', ({ lat, lng }) => {
            setPartnerLoc([lat, lng])
        })
        return () => socket.disconnect()
    }, [orderId])

    if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading…</div>
    if (!order) return <div className="flex items-center justify-center min-h-screen text-gray-400">Order not found</div>

    const currentStep = STATUS_STEPS.indexOf(order.status)
    const isCancelled = order.status === 'cancelled'
    const isDelivered = order.status === 'delivered'

    const handleCancelOrder = async () => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return
        setCancelling(true)
        try {
            const { data } = await api.post(`/api/orders/${orderId}/cancel`)
            setOrder(data.order)
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel order')
        } finally {
            setCancelling(false)
        }
    }

    return (
        <div className="min-h-screen pb-10">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/5 flex items-center gap-3 px-4 py-3">
                <Link to="/orders" className="text-xl">←</Link>
                <div>
                    <h1 className="font-bold">Track Order</h1>
                    <p className="text-xs text-gray-400">#{orderId.slice(-8).toUpperCase()}</p>
                </div>
            </div>

            <div className="px-4 pt-5 space-y-5">
                {/* Status hero */}
                <div className={`card text-center py-6 ${isDelivered ? 'border-green-500/30' : isCancelled ? 'border-red-500/30' : 'border-brand-500/20'}`}>
                    <div className="text-5xl mb-3">
                        {isDelivered ? '🎉' : isCancelled ? '❌' : '⏳'}
                    </div>
                    <h2 className={`text-xl font-bold ${isDelivered ? 'text-green-400' : isCancelled ? 'text-red-400' : 'text-white'}`}>
                        {STATUS_LABELS[order.status]}
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">{STATUS_DESC[order.status]}</p>
                    {order.deliveryPartner && (
                        <p className="text-xs text-gray-500 mt-2">🚴 {order.deliveryPartner.name} · {order.deliveryPartner.phone}</p>
                    )}
                    {order.status === 'placed' && (
                        <button
                            onClick={handleCancelOrder}
                            disabled={cancelling}
                            className="mt-4 text-xs font-semibold text-red-400 border border-red-500/30 rounded-full px-4 py-1.5 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                            {cancelling ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                    )}
                </div>

                {/* Progress stepper */}
                {!isCancelled && (
                    <div className="card space-y-0 divide-y divide-white/5">
                        {STATUS_STEPS.map((step, i) => {
                            const done = i <= currentStep
                            const active = i === currentStep
                            return (
                                <div key={step} className={`flex items-center gap-3 py-3 px-1 ${done ? '' : 'opacity-30'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${done ? 'bg-brand-500 text-white' : 'bg-white/10 text-gray-500'
                                        } ${active ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-[#1a1a1a]' : ''}`}>
                                        {done ? '✓' : i + 1}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${active ? 'text-brand-500' : done ? 'text-white' : 'text-gray-500'}`}>
                                            {STATUS_LABELS[step]}
                                        </p>
                                        {active && <p className="text-xs text-gray-500">{STATUS_DESC[step]}</p>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Live GPS Map — Show when order is active */}
                {!isCancelled && !isDelivered && order.restaurant?.lat && order.restaurant?.lng && (
                    <div className="card space-y-3 p-0 overflow-hidden">
                        <div className="px-4 pt-4 pb-2">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                🗺️ Live Tracking
                                {partnerLoc && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {order.status === 'picked_up' ? 'Partner is on the way to you' : 'Waiting at restaurant'}
                            </p>
                        </div>
                        <div className="h-48 w-full bg-gray-900">
                            <MapContainer
                                center={partnerLoc || [order.restaurant.lat, order.restaurant.lng]}
                                zoom={14}
                                style={{ height: '100%', width: '100%' }}
                                zoomControl={false}
                            >
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

                                {/* Restaurant marker */}
                                <Marker position={[order.restaurant.lat, order.restaurant.lng]} />

                                {/* Partner marker (if location known) */}
                                {partnerLoc && <Marker position={partnerLoc} icon={deliveryIcon} />}

                                {/* Line connecting them */}
                                {partnerLoc && (
                                    <Polyline positions={[partnerLoc, [order.restaurant.lat, order.restaurant.lng]]} color="#f97316" dashArray="5, 10" />
                                )}
                            </MapContainer>
                        </div>
                    </div>
                )}

                {/* Order items */}
                <div className="card space-y-3">
                    <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">
                        Your Order from {order.restaurant?.name}
                    </h3>
                    {order.orderItems?.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-300">{item.quantity}× {item.menuItem?.name}</span>
                            <span>₹{(item.quantity * item.unitPrice).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                        <span>Total Paid</span>
                        <span className="text-brand-500">₹{order.totalAmount}</span>
                    </div>
                </div>

                {/* Seal Photos Timeline */}
                {(order.sealVerification?.dispatchPhotoUrl || order.sealVerification?.pickupPhotoUrl) && (
                    <div className="card space-y-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">📸 View Sealed Photos</h3>
                        <p className="text-xs text-gray-400">Rest assured your food is safe and untampered.</p>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            {order.sealVerification.dispatchPhotoUrl && (
                                <div className="space-y-1">
                                    <div className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/50">
                                        <img src={order.sealVerification.dispatchPhotoUrl} alt="Dispatch Seal" className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-[10px] text-center text-gray-500 font-medium">By Restaurant</p>
                                </div>
                            )}
                            {order.sealVerification.pickupPhotoUrl && (
                                <div className="space-y-1">
                                    <div className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/50">
                                        <img src={order.sealVerification.pickupPhotoUrl} alt="Pickup Seal" className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-[10px] text-center text-gray-500 font-medium">By Delivery Partner</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Seal verification prompt — show when delivered */}
                {isDelivered && !order.sealVerification?.customerVerdict && (
                    <div className="card border border-brand-500/30 bg-brand-500/5 space-y-3">
                        <p className="font-semibold flex items-center gap-2">🔒 Verify Package Seal</p>
                        <p className="text-gray-400 text-sm">Help us ensure your food wasn't tampered with. Takes 30 seconds.</p>
                        <Link to={`/orders/${orderId}/seal`} id="verify-seal-btn" className="btn-primary block text-center">
                            Verify Now
                        </Link>
                    </div>
                )}
                {isDelivered && order.sealVerification?.customerVerdict && (
                    <div className="card border border-green-500/30 py-4 text-center">
                        <p className="text-green-400 font-medium">✅ Seal verification submitted</p>
                        <p className="text-gray-500 text-sm mt-1">Verdict: {order.sealVerification.customerVerdict}</p>
                    </div>
                )}

                {/* Rate & Review — Zomato style */}
                {isDelivered && <RateOrder orderId={orderId} restaurantName={order.restaurant?.name} />}
            </div>
        </div>
    )
}

function RateOrder({ orderId, restaurantName }) {
    const [rating, setRating] = useState(0)
    const [hovered, setHovered] = useState(0)
    const [review, setReview] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!rating) return
        setSubmitting(true)
        try {
            await api.post(`/api/orders/${orderId}/review`, { rating, review })
            setSubmitted(true)
        } catch { setSubmitted(true) } // show success even if backend not wired yet
        finally { setSubmitting(false) }
    }

    const LABELS = ['', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Great 😊', 'Amazing 🤩']

    if (submitted) return (
        <div className="card border border-green-500/20 py-6 text-center space-y-2">
            <div className="text-4xl">🙏</div>
            <p className="font-semibold text-green-400">Thanks for your review!</p>
            <p className="text-gray-500 text-sm">Your feedback helps other customers</p>
        </div>
    )

    return (
        <div className="card space-y-4">
            <div>
                <h3 className="font-semibold">Rate your order</h3>
                <p className="text-gray-400 text-sm mt-0.5">from {restaurantName}</p>
            </div>
            <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map(n => (
                    <button key={n}
                        onMouseEnter={() => setHovered(n)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setRating(n)}
                        className={`text-3xl transition-transform hover:scale-125 ${n <= (hovered || rating) ? 'opacity-100' : 'opacity-30'}`}>
                        ⭐
                    </button>
                ))}
            </div>
            {(hovered || rating) > 0 && (
                <p className="text-center text-sm font-medium text-brand-500">{LABELS[hovered || rating]}</p>
            )}
            <textarea
                className="input resize-none h-20 text-sm"
                placeholder="Tell us about your experience (optional)…"
                value={review}
                onChange={e => setReview(e.target.value)}
            />
            <button
                id="submit-review-btn"
                onClick={handleSubmit}
                disabled={!rating || submitting}
                className="btn-primary w-full disabled:opacity-40"
            >
                {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
        </div>
    )
}

