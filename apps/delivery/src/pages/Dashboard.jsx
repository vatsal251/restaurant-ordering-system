import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import { io } from 'socket.io-client'

const STATUS_COLORS = {
    ready_for_pickup: 'text-green-400 bg-green-400/10 border-green-400/30',
    picked_up: 'text-brand-500 bg-brand-500/10 border-brand-500/30',
    delivered: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
}

export default function Dashboard() {
    const { user, logout } = useAuthStore()
    const [available, setAvailable] = useState([])
    const [myOrders, setMyOrders] = useState([])
    const [tab, setTab] = useState('available')
    const [loading, setLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState(null)

    const fetchAvailable = useCallback(async () => {
        try {
            const { data } = await api.get('/api/orders/delivery/available')
            setAvailable(data)
        } catch { setAvailable([]) }
        finally { setLoading(false) }
    }, [])

    const fetchMyOrders = useCallback(async () => {
        try {
            const { data } = await api.get('/api/orders')
            setMyOrders(data.filter(o => o.deliveryPartnerId === user?.id))
        } catch { setMyOrders([]) }
    }, [user])

    useEffect(() => {
        fetchAvailable()
        fetchMyOrders()
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000')
        socket.on('NEW_ORDER', fetchAvailable)
        return () => socket.disconnect()
    }, [fetchAvailable, fetchMyOrders])

    const acceptOrder = async (orderId) => {
        setUpdatingId(orderId)
        try {
            await api.post(`/api/orders/${orderId}/assign-delivery`)
            setAvailable(a => a.filter(o => o.id !== orderId))
            fetchMyOrders()
        } catch { alert('Failed to accept order') }
        finally { setUpdatingId(null) }
    }

    const markDelivered = async (orderId) => {
        setUpdatingId(orderId)
        try {
            await api.patch(`/api/orders/${orderId}/status`, { status: 'delivered' })
            fetchMyOrders()
        } catch { alert('Failed to update') }
        finally { setUpdatingId(null) }
    }

    const activeDelivery = myOrders.find(o => o.status === 'picked_up')

    // Live Location Broadcasting
    useEffect(() => {
        if (!activeDelivery) return
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000')

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords
                socket.emit('LOCATION_UPDATE', { orderId: activeDelivery.id, lat, lng })
            },
            (err) => console.error('GPS Error:', err),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        )

        return () => {
            navigator.geolocation.clearWatch(watchId)
            socket.disconnect()
        }
    }, [activeDelivery])

    return (
        <div className="min-h-screen">
            {/* Top bar */}
            <div className="sticky top-0 z-10 bg-[#0a0f0a]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🚴</span>
                    <span className="font-bold text-brand-500">FoodRush Delivery</span>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/earnings" className="text-gray-400 hover:text-white text-sm">₹ Earnings</Link>
                    <Link to="/profile" className="text-gray-400 hover:text-white text-sm">Profile</Link>
                    <button onClick={logout} className="text-gray-500 hover:text-white text-sm">Logout</button>
                </div>
            </div>

            <div className="px-4 pt-5 pb-8 space-y-5">
                {/* Active delivery banner */}
                {activeDelivery && (
                    <div className="card border border-brand-500/40 bg-brand-500/5 space-y-3">
                        <p className="text-brand-500 font-semibold text-sm">🚴 Currently Delivering</p>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">#{activeDelivery.id.slice(-6).toUpperCase()}</p>
                                <p className="text-gray-400 text-sm">
                                    {activeDelivery.restaurant?.name} → {activeDelivery.customer?.name}
                                </p>
                                <p className="text-brand-500 font-semibold">₹{activeDelivery.totalAmount}</p>
                            </div>
                            <button
                                id={`deliver-${activeDelivery.id}`}
                                onClick={() => markDelivered(activeDelivery.id)}
                                disabled={updatingId === activeDelivery.id}
                                className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
                            >
                                {updatingId === activeDelivery.id ? '…' : '✅ Mark Delivered'}
                            </button>
                        </div>
                        <Link
                            to={`/order/${activeDelivery.id}/seal`}
                            className="block text-center text-sm text-brand-500 hover:underline"
                        >
                            📸 Take Pickup Seal Photo
                        </Link>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="card text-center p-3">
                        <p className="text-2xl font-bold text-brand-500">{available.length}</p>
                        <p className="text-xs text-gray-400 mt-1">Available</p>
                    </div>
                    <div className="card text-center p-3">
                        <p className="text-2xl font-bold text-green-400">{myOrders.filter(o => o.status === 'delivered').length}</p>
                        <p className="text-xs text-gray-400 mt-1">Delivered Today</p>
                    </div>
                    <div className="card text-center p-3">
                        <p className="text-2xl font-bold text-yellow-400">
                            ₹{myOrders.filter(o => o.status === 'delivered').length * 40}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Estimated</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    {['available', 'my'].map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tab === t ? 'bg-brand-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                                }`}>
                            {t === 'available' ? `Available Orders (${available.length})` : 'My Orders'}
                        </button>
                    ))}
                </div>

                {/* Order list */}
                {loading ? (
                    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-28" />)}</div>
                ) : tab === 'available' ? (
                    available.length === 0 ? (
                        <div className="text-center py-16 text-gray-500">
                            <div className="text-4xl mb-3">🚴</div>
                            <p>No available orders right now</p>
                            <p className="text-sm mt-1">Stay online — new orders will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {available.map(order => (
                                <div key={order.id} id={`order-${order.id}`} className="card space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">#{order.id.slice(-6).toUpperCase()}</p>
                                            <p className="text-sm text-gray-400">
                                                🏪 {order.restaurant?.name}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">📍 {order.deliveryAddress}</p>
                                        </div>
                                        <p className="text-brand-500 font-bold text-lg">+₹40</p>
                                    </div>
                                    <button
                                        id={`accept-${order.id}`}
                                        onClick={() => acceptOrder(order.id)}
                                        disabled={updatingId === order.id || !!activeDelivery}
                                        className="btn-primary w-full text-sm py-2.5 disabled:opacity-50"
                                    >
                                        {updatingId === order.id ? 'Accepting…'
                                            : activeDelivery ? 'Finish current delivery first'
                                                : '✅ Accept Order'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    myOrders.length === 0 ? (
                        <div className="text-center py-16 text-gray-500">
                            <p>No deliveries yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {myOrders.map(order => (
                                <div key={order.id} className="card space-y-2">
                                    <div className="flex justify-between">
                                        <div>
                                            <p className="font-medium">#{order.id.slice(-6).toUpperCase()}</p>
                                            <p className="text-sm text-gray-400">{order.restaurant?.name}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[order.status] || 'text-gray-400 bg-white/5 border-white/10'}`}>
                                            {order.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <p className="text-brand-500 font-semibold">₹{order.totalAmount} · +₹40 delivery</p>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    )
}
