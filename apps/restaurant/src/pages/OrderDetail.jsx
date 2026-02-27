import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
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

const NEXT_ACTIONS = {
    placed: { label: 'Confirm Order', nextStatus: 'confirmed' },
    confirmed: { label: 'Start Preparing', nextStatus: 'preparing' },
    preparing: { label: 'Ready for Pickup', nextStatus: 'ready_for_pickup' },
}

export default function OrderDetail() {
    const { id } = useParams()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        api.get(`/api/orders/${id}`)
            .then(r => setOrder(r.data))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [id])

    const updateStatus = async (status) => {
        setUpdating(true)
        try {
            await api.patch(`/api/orders/${id}/status`, { status })
            setOrder(o => ({ ...o, status }))
        } catch {
            alert('Failed to update status')
        } finally {
            setUpdating(false)
        }
    }

    if (loading) return <div className="min-h-screen flex text-gray-400 items-center justify-center">Loading...</div>
    if (!order) return <div className="min-h-screen flex text-gray-400 items-center justify-center">Order not found</div>

    const action = NEXT_ACTIONS[order.status]

    return (
        <div className="min-h-screen pb-24">
            <div className="sticky top-0 z-10 bg-[#0d0a12]/95 backdrop-blur border-b border-white/5 flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <Link to="/orders" className="text-xl">←</Link>
                    <h1 className="font-bold text-lg">Order #{order.id.slice(-6).toUpperCase()}</h1>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full border uppercase ${STATUS_COLORS[order.status]}`}>
                    {order.status.replace(/_/g, ' ')}
                </span>
            </div>

            <div className="px-4 pt-5 space-y-4">
                {/* Customer Details */}
                <div className="card space-y-2">
                    <h3 className="font-semibold text-gray-400 uppercase tracking-wide text-xs">Customer Details</h3>
                    <p className="font-medium text-lg">{order.customer?.name}</p>
                    <p className="text-gray-400 text-sm">📞 {order.customer?.phone}</p>
                    {order.deliveryAddress && (
                        <p className="text-sm text-gray-400 mt-2 bg-white/5 p-2 rounded">📍 {order.deliveryAddress}</p>
                    )}
                </div>

                {/* Items */}
                <div className="card space-y-3">
                    <h3 className="font-semibold text-gray-400 uppercase tracking-wide text-xs border-b border-white/5 pb-2">Order Items</h3>
                    {order.orderItems?.map(item => (
                        <div key={item.id} className="flex justify-between text-sm py-1">
                            <span><span className="text-brand-500 font-bold">{item.quantity}×</span> {item.menuItem?.name}</span>
                            <span className="text-gray-400">₹{item.unitPrice * item.quantity}</span>
                        </div>
                    ))}
                    <div className="border-t border-white/10 mt-2 pt-3 flex justify-between font-bold text-brand-500 text-lg">
                        <span>Total Amount</span>
                        <span>₹{order.totalAmount}</span>
                    </div>
                </div>

                {/* Instructions */}
                {(order.cookingInstructions || order.deliveryInstructions) && (
                    <div className="card space-y-2 bg-yellow-500/5 border-yellow-500/20">
                        <h3 className="font-semibold text-yellow-500 uppercase tracking-wide text-xs">Instructions</h3>
                        {order.cookingInstructions && <p className="text-sm text-gray-300"><strong className="text-yellow-400">Cooking:</strong> {order.cookingInstructions}</p>}
                        {order.deliveryInstructions && <p className="text-sm text-gray-300"><strong className="text-yellow-400">Delivery:</strong> {order.deliveryInstructions}</p>}
                    </div>
                )}

                {/* Delivery Partner */}
                {order.deliveryPartner && (
                    <div className="card space-y-1 bg-purple-500/5 border-purple-500/20">
                        <h3 className="font-semibold text-purple-400 uppercase tracking-wide text-xs">Delivery Partner</h3>
                        <p className="text-sm font-medium">{order.deliveryPartner.name}</p>
                        <p className="text-xs text-gray-400">📞 {order.deliveryPartner.phone}</p>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0d0a12]/95 backdrop-blur border-t border-white/5">
                {action ? (
                    <button
                        onClick={() => updateStatus(action.nextStatus)}
                        disabled={updating}
                        className="btn-primary w-full py-3 text-lg font-bold disabled:opacity-50"
                    >
                        {updating ? 'Updating...' : action.label}
                    </button>
                ) : order.status === 'ready_for_pickup' ? (
                    <Link to={`/orders/${order.id}/seal-dispatch`} className="btn-primary w-full py-3 text-lg font-bold block text-center">
                        SEAL & DISPATCH
                    </Link>
                ) : (
                    <button className="btn-primary w-full py-3 text-lg font-bold opacity-50 cursor-not-allowed uppercase" disabled>
                        {order.status.replace(/_/g, ' ')}
                    </button>
                )}
            </div>
        </div>
    )
}
