import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'

const STATUS_BADGE = {
    placed: { label: 'Placed', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-400/30' },
    confirmed: { label: 'Confirmed', cls: 'bg-blue-500/10 text-blue-400 border-blue-400/30' },
    preparing: { label: 'Preparing', cls: 'bg-orange-500/10 text-orange-400 border-orange-400/30' },
    ready_for_pickup: { label: 'Ready', cls: 'bg-green-500/10 text-green-400 border-green-400/30' },
    picked_up: { label: 'On the Way', cls: 'bg-brand-500/10 text-brand-500 border-brand-500/30' },
    delivered: { label: 'Delivered ✓', cls: 'bg-green-500/10 text-green-400 border-green-400/30' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-500/10 text-red-400 border-red-400/30' },
}

export default function OrderHistory() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/api/orders')
            .then(r => setOrders(r.data))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="min-h-screen pb-8">
            <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/5 flex items-center gap-3 px-4 py-3">
                <Link to="/" className="text-xl">←</Link>
                <h1 className="font-bold text-lg">My Orders</h1>
            </div>

            <div className="px-4 pt-4 space-y-3">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="card animate-pulse h-24" />)
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <div className="text-5xl mb-3">📋</div>
                        <p>No orders yet</p>
                        <Link to="/" className="text-brand-500 text-sm hover:underline mt-2 block">Order food now →</Link>
                    </div>
                ) : (
                    orders.map(order => {
                        const badge = STATUS_BADGE[order.status] || { label: order.status, cls: 'bg-white/5 text-gray-400 border-white/10' }
                        const active = !['delivered', 'cancelled'].includes(order.status)
                        return (
                            <Link to={`/orders/${order.id}`} key={order.id} id={`order-${order.id}`}>
                                <div className="card hover:scale-[1.01] transition-transform cursor-pointer space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold">{order.restaurant?.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badge.cls}`}>
                                            {badge.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        {order.orderItems?.slice(0, 2).map(i => i.menuItem?.name).join(', ')}
                                        {order.orderItems?.length > 2 ? ` +${order.orderItems.length - 2} more` : ''}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-brand-500">₹{order.totalAmount}</p>
                                        {active && (
                                            <span className="text-xs text-brand-500 animate-pulse">● Live tracking</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        )
                    })
                )}
            </div>
        </div>
    )
}
