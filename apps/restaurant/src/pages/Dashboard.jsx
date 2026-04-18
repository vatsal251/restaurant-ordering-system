import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import { io } from 'socket.io-client'

const STATUS_COLORS = {
    placed: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    confirmed: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    preparing: 'text-brand-500 bg-brand-500/10 border-brand-500/30',
    ready_for_pickup: 'text-green-400 bg-green-400/10 border-green-400/30',
    picked_up: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
    delivered: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
    cancelled: 'text-red-400 bg-red-400/10 border-red-400/30',
}

const STATUS_LABEL = {
    placed: '🔔 New Order',
    confirmed: '✅ Confirmed',
    preparing: '👨‍🍳 Preparing',
    ready_for_pickup: '📦 Ready',
    picked_up: '🚴 Picked Up',
    delivered: '✅ Delivered',
    cancelled: '❌ Cancelled',
}

const NEXT_ACTIONS = {
    placed: { label: '✅ Confirm Order', nextStatus: 'confirmed' },
    confirmed: { label: '👨‍🍳 Start Preparing', nextStatus: 'preparing' },
    preparing: { label: '📦 Mark Ready for Pickup', nextStatus: 'ready_for_pickup' },
}

export default function Dashboard() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('active')
    const [updatingId, setUpdatingId] = useState(null)
    const [isOpen, setIsOpen] = useState(true)
    const [togglingOpen, setTogglingOpen] = useState(false)

    const fetchOrders = useCallback(async () => {
        try {
            const { data } = await api.get('/api/orders/restaurant/pending')
            setOrders(data)
        } catch { setOrders([]) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => {
        fetchOrders()
        // Load restaurant open status
        api.get('/api/restaurants/me/profile').then(r => setIsOpen(r.data.isOpen)).catch(() => { })

        let titleInterval
        // Real-time socket for new orders
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000')
        socket.emit('JOIN_RESTAURANT_ROOM', { userId: user?.id })
        socket.on('NEW_ORDER', () => {
            fetchOrders()
            // Play a notification sound
            try { new Audio('https://www.soundjay.com/buttons/sounds/button-09.mp3').play() } catch { }

            // Flash browser tab title
            if (!document.hasFocus()) {
                let isOriginal = false
                clearInterval(titleInterval)
                titleInterval = setInterval(() => {
                    document.title = isOriginal ? 'FoodRush Restaurant' : '(1) New Order! - FoodRush'
                    isOriginal = !isOriginal
                }, 1000)
            }
        })

        const handleFocus = () => {
            clearInterval(titleInterval)
            document.title = 'FoodRush Restaurant'
        }
        window.addEventListener('focus', handleFocus)

        return () => {
            socket.disconnect()
            clearInterval(titleInterval)
            window.removeEventListener('focus', handleFocus)
            document.title = 'FoodRush Restaurant'
        }
    }, [fetchOrders, user])

    const toggleOpen = async () => {
        setTogglingOpen(true)
        try {
            await api.patch('/api/restaurants/me/profile', { isOpen: !isOpen })
            setIsOpen(o => !o)
        } catch { alert('Failed to update status') }
        finally { setTogglingOpen(false) }
    }

    const updateStatus = async (orderId, status) => {
        setUpdatingId(orderId)
        try {
            await api.patch(`/api/orders/${orderId}/status`, { status })
            setOrders(o => o.map(ord => ord.id === orderId ? { ...ord, status } : ord))
            // Auto-navigate to seal dispatch when marking ready for pickup
            if (status === 'ready_for_pickup') {
                navigate(`/orders/${orderId}/seal-dispatch`)
            }
        } catch { alert('Failed to update status') }
        finally { setUpdatingId(null) }
    }

    const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))

    return (
        <div className="min-h-screen">
            {/* Top bar */}
            <div className="sticky top-0 z-10 bg-[#0d0a12]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🍽️</span>
                    <span className="font-bold text-brand-500">FoodRush Restaurant</span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Open / Closed toggle */}
                    <button
                        onClick={toggleOpen}
                        disabled={togglingOpen}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${isOpen
                            ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-400' : 'bg-red-400'} ${!togglingOpen && 'animate-pulse'}`} />
                        {togglingOpen ? '...' : isOpen ? 'Open' : 'Closed'}
                    </button>
                    <Link to="/orders" className="text-gray-400 hover:text-white text-sm">History</Link>
                    <Link to="/menu" className="text-gray-400 hover:text-white text-sm">Menu</Link>
                    <Link to="/promotions" className="text-gray-400 hover:text-white text-sm">Promos</Link>
                    <Link to="/campaigns" className="text-gray-400 hover:text-white text-sm">Campaigns</Link>
                    <Link to="/analytics" className="text-gray-400 hover:text-white text-sm">Analytics</Link>
                    <Link to="/reviews" className="text-gray-400 hover:text-white text-sm">Reviews</Link>
                    <Link to="/profile" className="text-gray-400 hover:text-white text-sm">Profile</Link>
                    <button onClick={logout} className="text-gray-500 hover:text-white text-sm">Logout</button>
                </div>
            </div>

            <div className="px-4 pt-5 pb-8 space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="card text-center p-3">
                        <p className="text-2xl font-bold text-brand-500">{activeOrders.length}</p>
                        <p className="text-xs text-gray-400 mt-1">Active Orders</p>
                    </div>
                    <div className="card text-center p-3">
                        <p className="text-2xl font-bold text-green-400">
                            {orders.filter(o => o.status === 'ready_for_pickup').length}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Ready for Pickup</p>
                    </div>
                    <div className="card text-center p-3">
                        <p className="text-2xl font-bold text-yellow-400">
                            {orders.filter(o => o.status === 'placed').length}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">New Orders</p>
                    </div>
                </div>

                {/* Alert for new orders */}
                {orders.filter(o => o.status === 'placed').length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2 animate-pulse">
                        🔔 You have {orders.filter(o => o.status === 'placed').length} new order(s) waiting!
                    </div>
                )}

                {/* Tab switcher */}
                <div className="flex gap-2">
                    {['active', 'all'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-brand-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                                }`}>{tab === 'active' ? 'Active Orders' : 'All Orders'}</button>
                    ))}
                </div>

                {/* Order cards */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-32" />)}
                    </div>
                ) : (activeTab === 'active' ? activeOrders : orders).length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <div className="text-4xl mb-3">🍽️</div>
                        <p>{activeTab === 'active' ? 'No active orders right now' : 'No orders yet'}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {(activeTab === 'active' ? activeOrders : orders).map(order => (
                            <div key={order.id} id={`order-${order.id}`} className="card space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold">#{order.id.slice(-6).toUpperCase()}</p>
                                        <p className="text-sm text-gray-400">{order.customer?.name} · ₹{order.totalAmount}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_COLORS[order.status]}`}>
                                        {STATUS_LABEL[order.status]}
                                    </span>
                                </div>

                                {/* Items */}
                                <div className="text-sm text-gray-400">
                                    {order.orderItems?.map(i => (
                                        <span key={i.id}>{i.quantity}× {i.menuItem?.name} </span>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {NEXT_ACTIONS[order.status] && (
                                        <button
                                            id={`action-${order.id}`}
                                            onClick={() => updateStatus(order.id, NEXT_ACTIONS[order.status].nextStatus)}
                                            disabled={updatingId === order.id}
                                            className="btn-primary text-sm py-2 flex-1 disabled:opacity-50"
                                        >
                                            {updatingId === order.id ? 'Updating…' : NEXT_ACTIONS[order.status].label}
                                        </button>
                                    )}
                                    {order.status === 'placed' && (
                                        <button
                                            id={`cancel-${order.id}`}
                                            onClick={() => updateStatus(order.id, 'cancelled')}
                                            disabled={updatingId === order.id}
                                            className="text-sm text-red-400 border border-red-400/30 rounded-xl px-4 py-2 hover:bg-red-500/10"
                                        >
                                            ❌ Reject
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
