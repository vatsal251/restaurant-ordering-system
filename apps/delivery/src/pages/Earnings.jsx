import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

export default function Earnings() {
    const { user, logout } = useAuthStore()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/api/orders')
            .then(r => setOrders(r.data.filter(o => o.deliveryPartnerId === user?.id)))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false))
    }, [user])

    const delivered = orders.filter(o => o.status === 'delivered')
    const todayDelivered = delivered.filter(o => {
        const d = new Date(o.updatedAt)
        const today = new Date()
        return d.toDateString() === today.toDateString()
    })

    const PER_DELIVERY = 40
    const totalEarnings = delivered.length * PER_DELIVERY
    const todayEarnings = todayDelivered.length * PER_DELIVERY

    return (
        <div className="min-h-screen pb-10">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0a0f0a]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center gap-3">
                <Link to="/" className="text-xl">←</Link>
                <h1 className="font-bold">My Earnings</h1>
            </div>

            <div className="px-4 pt-6 space-y-5">
                {/* Identity */}
                <div className="card text-center py-6 space-y-2">
                    <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center text-2xl font-bold mx-auto">
                        {user?.name?.[0]?.toUpperCase() || 'D'}
                    </div>
                    <h2 className="text-lg font-bold">{user?.name}</h2>
                    <p className="text-gray-400 text-sm">{user?.email}</p>
                    <span className="inline-block bg-green-500/10 text-green-400 text-xs px-3 py-1 rounded-full border border-green-500/20">
                        🚴 Delivery Partner
                    </span>
                </div>

                {/* Earnings summary */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="card text-center p-4 border border-brand-500/20">
                        <p className="text-3xl font-bold text-brand-500">₹{todayEarnings}</p>
                        <p className="text-xs text-gray-400 mt-1">Today's Earnings</p>
                        <p className="text-xs text-gray-600 mt-0.5">{todayDelivered.length} deliveries</p>
                    </div>
                    <div className="card text-center p-4">
                        <p className="text-3xl font-bold text-green-400">₹{totalEarnings}</p>
                        <p className="text-xs text-gray-400 mt-1">Total Earnings</p>
                        <p className="text-xs text-gray-600 mt-0.5">{delivered.length} deliveries</p>
                    </div>
                </div>

                {/* Per-delivery info */}
                <div className="card flex items-center justify-between">
                    <div>
                        <p className="font-medium">Delivery Rate</p>
                        <p className="text-gray-500 text-sm">Per completed delivery</p>
                    </div>
                    <p className="text-2xl font-bold text-brand-500">₹{PER_DELIVERY}</p>
                </div>

                {/* Delivery history */}
                <div className="card space-y-3">
                    <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">Delivery History</h3>
                    {loading ? (
                        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="animate-pulse h-12 bg-white/5 rounded-xl" />)}</div>
                    ) : delivered.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No deliveries yet. Accept orders to start earning!</p>
                    ) : (
                        delivered.slice(0, 10).map(o => (
                            <div key={o.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <div>
                                    <p className="font-medium text-sm">#{o.id.slice(-6).toUpperCase()}</p>
                                    <p className="text-xs text-gray-500">{o.restaurant?.name} → {o.customer?.name}</p>
                                    <p className="text-xs text-gray-600">{new Date(o.updatedAt).toLocaleDateString()}</p>
                                </div>
                                <p className="text-green-400 font-bold">+₹{PER_DELIVERY}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Logout */}
                <button onClick={logout} className="w-full py-3 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-medium">
                    Sign Out
                </button>
            </div>
        </div>
    )
}
