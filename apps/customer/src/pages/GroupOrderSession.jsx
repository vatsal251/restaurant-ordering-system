import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { toast } from 'react-hot-toast'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useGroupOrderStore } from '../store/groupOrderStore'
import BillSplitterModal from '../components/BillSplitterModal'

export default function GroupOrderSession() {
    const { id } = useParams() // Group order id
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { setGroupSession } = useGroupOrderStore()

    const [groupOrder, setGroupOrder] = useState(null)
    const [participantName, setParticipantName] = useState(user?.name?.split(' ')[0] || '')
    const [loading, setLoading] = useState(true)
    const [showSplitter, setShowSplitter] = useState(false)

    useEffect(() => {
        // Fetch group order details
        api.get(`/api/group-orders/${id}`)
            .then(res => {
                setGroupOrder(res.data)
            })
            .catch(err => {
                toast.error('Session not found or expired')
                navigate('/')
            })
            .finally(() => setLoading(false))

        // Set up socket listener
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000')
        socket.emit('JOIN_GROUP_ORDER_ROOM', { groupOrderId: id })

        socket.on('GROUP_CART_UPDATED', () => {
            // Re-fetch to get latest state
            api.get(`/api/group-orders/${id}`).then(res => setGroupOrder(res.data))
        })

        socket.on('GROUP_ORDER_LOCKED', () => {
            setGroupOrder(prev => ({ ...prev, status: 'locked' }))
            toast('The host has locked the order! No more items can be added.', { icon: '🔒' })
        })

        socket.on('GROUP_ORDER_COMPLETED', ({ orderId }) => {
            toast.success('Order placed successfully by host!')
            navigate(`/orders/${orderId}`)
        })

        return () => socket.disconnect()
    }, [id, navigate])

    const joinAndBrowse = () => {
        if (!participantName) return toast.error('Please enter your name first!')
        if (groupOrder.status !== 'active') return toast.error('This order is locked.')
        setGroupSession(id, participantName, groupOrder.status)
        toast.success(`Joined as ${participantName}. Browse and add items!`)
        navigate('/')
    }

    const removeItem = async (itemId) => {
        if (groupOrder.status !== 'active') return toast.error('This order is locked.')
        try {
            await api.delete(`/api/group-orders/${id}/items/${itemId}`)
            toast.error('Item removed')
        } catch (error) {
            toast.error('Failed to remove item')
        }
    }

    const lockOrder = async () => {
        if (!window.confirm('Are you sure? Once locked, nobody can add more items.')) return
        try {
            await api.post(`/api/group-orders/${id}/lock`)
            toast.success('Order locked successfully')
        } catch (error) {
            toast.error('Failed to lock order')
        }
    }

    if (loading) return <div className="min-h-screen pt-20 text-center flex flex-col items-center"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div><p className="mt-4 text-gray-400">Joining Group Order...</p></div>
    if (!groupOrder) return null

    const isHost = user?.id === groupOrder.hostId
    const isLocked = groupOrder.status !== 'active'
    const totalItemsAmount = groupOrder.items.reduce((s, i) => s + (i.price * i.quantity), 0)
    const taxesAndFees = 40 + (totalItemsAmount * 0.05) // 5% tax + $40 simulated delivery

    // Group items by participant
    const itemsByParticipant = groupOrder.items.reduce((acc, item) => {
        if (!acc[item.participantName]) acc[item.participantName] = []
        acc[item.participantName].push(item)
        return acc
    }, {})

    const activeParticipants = Array.from(new Set([groupOrder.host.name, ...Object.keys(itemsByParticipant)]))

    return (
        <div className="min-h-screen bg-[#0f0f0f] pb-32">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md pt-3 pb-3 px-4 border-b border-white/10 shadow-lg">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-brand-500">
                        👥 Group Order
                    </h1>
                    <div className={`px-3 py-1 text-xs font-bold rounded-full ${isLocked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse'}`}>
                        {isLocked ? '🔒 LOCKED' : '🟢 LIVE'}
                    </div>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                    <p>Host: <span className="text-white font-medium">{groupOrder.host.name}</span></p>
                    <p><span className="text-brand-400 font-medium break-words">Multi-Restaurant Global Cart</span></p>
                </div>

                {/* Share Link */}
                <div className="mt-3 flex gap-2">
                    <input type="text" readOnly value={window.location.href} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400 focus:outline-none" />
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-semibold">Copy</button>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">

                {/* LEFT: Menu / Adding Items */}
                <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sticky top-36">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Name for this Order</label>
                        <input
                            type="text"
                            value={participantName}
                            onChange={e => setParticipantName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                            readOnly={isLocked}
                        />
                        {isLocked && <p className="text-xs text-red-400 mt-2">The host has locked this order. You can no longer add items or change your name.</p>}
                    </div>

                    {!isLocked && (
                        <div className="bg-[#1a1a1a] border border-brand-500/30 rounded-2xl p-6 text-center shadow-lg shadow-brand-500/10">
                            <h2 className="font-bold text-xl mb-2 text-white">Join the Party 🍕🍔</h2>
                            <p className="text-sm text-gray-400 mb-6">Enter your name above and click below to start browsing restaurants and adding food to the shared cart.</p>

                            <button
                                onClick={joinAndBrowse}
                                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-transform hover:scale-105"
                            >
                                Browse Restaurants & Add Food ➔
                            </button>
                        </div>
                    )}

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-4">
                        <h3 className="font-bold text-gray-300 mb-3 flex items-center gap-2"><span className="text-brand-500">👥</span> Active Participants</h3>
                        <div className="flex flex-wrap gap-2">
                            {activeParticipants.map((p, idx) => (
                                <div key={idx} className="bg-black/40 border border-white/10 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    {p} {p === groupOrder.host.name && <span className="text-[10px] text-brand-400 border border-brand-500/30 px-1.5 rounded uppercase">Host</span>}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-white/5">Anyone with the link can join and add items. Real-time sync ensures you always see everyone's choices!</p>
                    </div>
                </div>

                {/* RIGHT: Live Shared Cart */}
                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl flex flex-col h-fit sticky top-36 shadow-2xl">
                    <div className="bg-gradient-to-r from-blue-900/40 to-brand-900/40 px-5 py-4 border-b border-white/10 rounded-t-2xl flex justify-between items-center">
                        <div>
                            <h2 className="font-bold text-lg">Live Cart</h2>
                            <p className="text-xs text-blue-200 mt-0.5">Real-time sync enabled</p>
                        </div>
                        <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e] animate-pulse"></div>
                    </div>

                    <div className="p-5 flex-1 max-h-[50vh] overflow-y-auto space-y-6">
                        {Object.keys(itemsByParticipant).length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                <div className="text-4xl mb-3 opacity-50">🛒</div>
                                <p>Cart is empty.</p>
                                <p className="text-sm">Be the first to add something!</p>
                            </div>
                        ) : (
                            Object.entries(itemsByParticipant).map(([name, items]) => (
                                <div key={name} className="animate-in fade-in slide-in-from-top-2">
                                    <h3 className="text-sm font-bold bg-white/10 inline-block px-3 py-1 rounded-full mb-3 shadow-sm border border-white/5">
                                        👤 {name}'s Items
                                    </h3>
                                    <div className="space-y-2 pl-2">
                                        {items.map(item => (
                                            <div key={item.id} className="flex justify-between items-center bg-black/30 p-2.5 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium text-sm">{item.quantity}x {item.menuItem.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-semibold text-gray-300">₹{item.price * item.quantity}</span>
                                                    {!isLocked && (isHost || name === participantName) && (
                                                        <button onClick={() => removeItem(item.id)} className="text-gray-500 hover:text-red-400 text-lg leading-none p-1 rounded hover:bg-white/5">×</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-right text-xs text-gray-400 mt-2 pr-2 font-medium">
                                        Subtotal: ₹{items.reduce((s, i) => s + (i.price * i.quantity), 0)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Subtotal Footer */}
                    <div className="bg-black/40 p-5 rounded-b-2xl border-t border-white/10 space-y-3">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Total Items Price</span>
                            <span>₹{totalItemsAmount}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg text-white border-t border-white/10 pt-3">
                            <span>Estimated Total (excl. fees)</span>
                            <span className="text-brand-400">₹{totalItemsAmount}</span>
                        </div>

                        {/* Host controls */}
                        {isHost && (
                            <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/95 border-t border-white/10 backdrop-blur-xl z-50 flex gap-3">
                                {!isLocked ? (
                                    <button onClick={lockOrder} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-xl transition border border-white/20">
                                        🔒 Lock Order
                                    </button>
                                ) : (
                                    <button onClick={() => setShowSplitter(true)} className="flex-1 bg-gradient-to-r from-brand-500 to-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2 transition-transform">
                                        Proceed to Checkout & Split Bill ➔
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bill Splitter Modal overlay */}
            {showSplitter && (
                <BillSplitterModal
                    itemsByParticipant={itemsByParticipant}
                    groupOrderId={id}
                    onClose={() => setShowSplitter(false)}
                />
            )}
        </div>
    )
}
