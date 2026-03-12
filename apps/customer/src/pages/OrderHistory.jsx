import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
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
    const [reordering, setReordering] = useState(null)
    const { addItem, clearCart } = useCartStore()
    const navigate = useNavigate()

    useEffect(() => {
        api.get('/api/orders')
            .then(r => setOrders(r.data))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false))
    }, [])

    const handleReorder = async (order) => {
        if (!order.orderItems?.length) return
        setReordering(order.id)
        try {
            clearCart()
            // Re-add all items from this order
            order.orderItems.forEach(item => {
                for (let i = 0; i < item.quantity; i++) {
                    addItem({
                        id: item.menuItemId,
                        name: item.menuItem?.name || 'Item',
                        price: item.unitPrice,
                        restaurantId: order.restaurantId || order.restaurant?.id,
                        restaurantName: order.restaurant?.name,
                    })
                }
            })
            navigate('/cart')
        } catch { alert('Could not reorder') }
        finally { setReordering(null) }
    }

    return (
        <div className="min-h-screen pb-10 bg-gray-50 font-sans">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center gap-3 px-4 py-3 shadow-sm">
                <Link to="/" className="text-xl text-gray-600 hover:text-gray-900 transition-colors">←</Link>
                <h1 className="font-bold text-gray-900 text-lg">My Orders</h1>
            </div>

            <div className="px-4 pt-6 space-y-4">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="bg-white border border-gray-200 rounded-2xl animate-pulse h-32 shadow-sm" />)
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
                        <div className="text-5xl mb-3 opacity-50">📋</div>
                        <p className="font-bold text-gray-900 text-lg">No orders yet</p>
                        <Link to="/" className="text-brand-600 font-bold text-sm hover:underline mt-2 inline-block bg-brand-50 px-4 py-2 rounded-xl">Order food now →</Link>
                    </div>
                ) : (
                    orders.map(order => {
                        const badge = STATUS_BADGE[order.status] || { label: order.status, cls: 'bg-gray-100 text-gray-600 border-gray-200' }
                        const active = !['delivered', 'cancelled'].includes(order.status)
                        const canReorder = order.status === 'delivered' && order.orderItems?.length > 0

                        return (
                            <div key={order.id} id={`order-${order.id}`} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <Link to={`/orders/${order.id}`} className="block">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-bold text-gray-900 text-lg">{order.restaurant?.name}</p>
                                            <p className="text-xs font-semibold text-gray-500 mt-0.5">
                                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full border ${badge.cls}`}>
                                            {badge.label}
                                        </span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-sm font-medium text-gray-600">
                                            {order.orderItems?.slice(0, 2).map(i => i.menuItem?.name).join(', ')}
                                            {order.orderItems?.length > 2 ? ` +${order.orderItems.length - 2} more` : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <p className="font-black text-gray-900 text-lg">₹{order.totalAmount}</p>
                                        {active && <span className="text-xs font-bold uppercase tracking-wide text-brand-600 animate-pulse bg-brand-50 px-2 py-1 rounded-md">● Live tracking</span>}
                                    </div>
                                </Link>

                                {/* Reorder button */}
                                {canReorder && (
                                    <div className="mt-4 flex gap-2 w-full pt-4 border-t border-gray-100">
                                        <button
                                            id={`reorder-${order.id}`}
                                            onClick={() => handleReorder(order)}
                                            disabled={reordering === order.id}
                                            className="w-full py-2.5 rounded-xl border border-brand-200 bg-brand-50 text-brand-600 text-sm font-bold hover:bg-brand-100 transition-colors disabled:opacity-50"
                                        >
                                            {reordering === order.id ? 'Adding to cart…' : '🔁 Reorder'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
