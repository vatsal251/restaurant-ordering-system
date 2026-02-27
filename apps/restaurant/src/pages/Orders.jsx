import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'

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
    placed: 'Placed',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready_for_pickup: 'Ready',
    picked_up: 'Picked Up',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
}

export default function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all, active, past
    const navigate = useNavigate()

    useEffect(() => {
        api.get('/api/orders/restaurant/all')
            .then(r => setOrders(r.data))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const filteredOrders = orders.filter(o => {
        if (filter === 'active') return !['delivered', 'cancelled'].includes(o.status)
        if (filter === 'past') return ['delivered', 'cancelled'].includes(o.status)
        return true
    })

    return (
        <div className="min-h-screen pb-10">
            <div className="sticky top-0 z-10 bg-[#0d0a12]/95 backdrop-blur border-b border-white/5 flex items-center gap-3 px-4 py-3">
                <Link to="/" className="text-xl">←</Link>
                <h1 className="font-bold text-lg">Order History</h1>
            </div>

            <div className="px-4 pt-5 space-y-5">
                <div className="flex gap-2 mb-4">
                    {['all', 'active', 'past'].map(tab => (
                        <button key={tab} onClick={() => setFilter(tab)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${filter === tab ? 'bg-brand-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                                }`}>
                            {tab}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-32" />)}
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <div className="text-4xl mb-3">🍽️</div>
                        <p>No {filter} orders found.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredOrders.map(order => (
                            <div key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="card space-y-3 cursor-pointer hover:border-brand-500/50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold">#{order.id.slice(-6).toUpperCase()}</p>
                                        <p className="text-sm text-gray-400">{order.customer?.name} · {order.customer?.phone}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-brand-500 mb-2">₹{order.totalAmount}</p>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_COLORS[order.status]}`}>
                                            {STATUS_LABEL[order.status]}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-sm text-gray-400 truncate border-t border-white/5 pt-2">
                                    {order.orderItems?.map(i => `${i.quantity}× ${i.menuItem?.name}`).join(', ')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
