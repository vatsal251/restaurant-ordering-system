import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

export default function Profile() {
    const { user, logout } = useAuthStore()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('info')

    useEffect(() => {
        api.get('/api/orders')
            .then(r => setOrders(r.data))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false))
    }, [])

    const totalSpent = orders
        .filter(o => o.status === 'delivered')
        .reduce((s, o) => s + o.totalAmount, 0)

    return (
        <div className="min-h-screen pb-10">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center gap-3">
                <Link to="/" className="text-xl">←</Link>
                <h1 className="font-bold">My Profile</h1>
            </div>

            <div className="px-4 pt-6 space-y-5">
                {/* Avatar / identity card */}
                <div className="card text-center py-8 space-y-3">
                    <div className="w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center text-3xl font-bold mx-auto">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{user?.name}</h2>
                        <p className="text-gray-400 text-sm">{user?.email}</p>
                        {user?.phone && <p className="text-gray-500 text-sm">{user?.phone}</p>}
                    </div>
                    <span className="inline-block bg-brand-500/10 text-brand-500 text-xs px-3 py-1 rounded-full border border-brand-500/20">
                        Customer
                    </span>
                </div>

                {/* Quick actions grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <Link to="/favourites" className="card flex flex-col items-center justify-center p-3 hover:bg-white/5 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-xl group-hover:bg-brand-500/20 transition-colors">♥</div>
                        <p className="font-semibold text-white mt-2 text-sm">Favourites</p>
                    </Link>
                    <Link to="/addresses" className="card flex flex-col items-center justify-center p-3 hover:bg-white/5 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-xl group-hover:bg-green-500/20 transition-colors">📍</div>
                        <p className="font-semibold text-white mt-2 text-sm">Addresses</p>
                    </Link>
                    <Link to="/orders" className="card flex flex-col items-center justify-center p-3 hover:bg-white/5 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-xl group-hover:bg-blue-500/20 transition-colors">📦</div>
                        <p className="font-semibold text-white mt-2 text-sm">Orders</p>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="card text-center p-3">
                        <p className="text-xl font-bold text-brand-500">{orders.length}</p>
                        <p className="text-xs text-gray-400 mt-1">Total</p>
                    </div>
                    <div className="card text-center p-3">
                        <p className="text-xl font-bold text-green-400">{orders.filter(o => o.status === 'delivered').length}</p>
                        <p className="text-xs text-gray-400 mt-1">Delivered</p>
                    </div>
                    <div className="card text-center p-3">
                        <p className="text-xl font-bold text-yellow-400">₹{totalSpent.toFixed(0)}</p>
                        <p className="text-xs text-gray-400 mt-1">Spent</p>
                    </div>
                </div>

                {/* Recent orders */}
                <div className="card space-y-3">
                    <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">Recent Orders</h3>
                    {loading ? (
                        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="animate-pulse h-12 bg-white/5 rounded-xl" />)}</div>
                    ) : orders.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No orders yet</p>
                    ) : (
                        orders.slice(0, 5).map(o => (
                            <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between py-2 hover:bg-white/5 rounded-xl px-2 -mx-2 transition-colors">
                                <div>
                                    <p className="font-medium text-sm">#{o.id.slice(-6).toUpperCase()}</p>
                                    <p className="text-xs text-gray-500">{o.restaurant?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-brand-500 font-semibold text-sm">₹{o.totalAmount}</p>
                                    <p className={`text-xs ${o.status === 'delivered' ? 'text-green-400' : o.status === 'cancelled' ? 'text-red-400' : 'text-yellow-400'}`}>
                                        {o.status.replace(/_/g, ' ')}
                                    </p>
                                </div>
                            </Link>
                        ))
                    )}
                    {orders.length > 5 && (
                        <Link to="/orders" className="text-brand-500 text-sm hover:underline block text-center pt-1">
                            View all {orders.length} orders →
                        </Link>
                    )}
                </div>

                {/* Logout */}
                <button
                    onClick={logout}
                    className="w-full py-3 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                >
                    Sign Out
                </button>
            </div>
        </div>
    )
}
