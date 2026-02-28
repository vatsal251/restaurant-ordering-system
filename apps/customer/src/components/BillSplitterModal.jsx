import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../lib/api'
import { useGroupOrderStore } from '../store/groupOrderStore'

export default function BillSplitterModal({ itemsByParticipant, groupOrderId, onClose }) {
    const navigate = useNavigate()
    const { clearSession } = useGroupOrderStore()
    const [loading, setLoading] = useState(false)
    const [splitType, setSplitType] = useState('even') // 'even' | 'exact'
    const [deliveryAddress, setDeliveryAddress] = useState('')

    // Flatten all items
    const allItems = []
    Object.values(itemsByParticipant).forEach(items => {
        allItems.push(...items)
    })

    const participants = Object.keys(itemsByParticipant)
    const numPeople = participants.length

    // Math
    const subtotal = allItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const taxes = subtotal * 0.05
    const deliveryFee = 40 // Fixed combined delivery fee
    const totalAmount = subtotal + taxes + deliveryFee

    // Split calculations
    const splits = useMemo(() => {
        const res = {}
        if (numPeople === 0) return res

        if (splitType === 'even') {
            const amountPerPerson = totalAmount / numPeople
            participants.forEach(p => res[p] = amountPerPerson)
        } else {
            // Exact split: Person pays for their items + (shared taxes and delivery fee / numPeople)
            const sharedFeesPerPerson = (taxes + deliveryFee) / numPeople
            participants.forEach(p => {
                const myItemsSubtotal = itemsByParticipant[p].reduce((s, i) => s + (i.price * i.quantity), 0)
                res[p] = myItemsSubtotal + sharedFeesPerPerson
            })
        }
        return res
    }, [itemsByParticipant, splitType, totalAmount, numPeople, taxes, deliveryFee])

    const handleCheckout = async (e) => {
        e.preventDefault()
        if (!deliveryAddress.trim()) return toast.error('Please provide a delivery address')

        setLoading(true)
        try {
            const res = await api.post(`/api/group-orders/${groupOrderId}/checkout`, {
                deliveryAddress,
                totalAmount,
                paymentMethod: 'cod' // Simplified for this demo
            })
            toast.success('Group Order Placed!')
            clearSession()
            navigate('/orders')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to checkout')
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-end sm:items-center justify-center animate-in fade-in duration-200">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#1a1a1a] rounded-t-3xl sm:rounded-3xl relative animate-in slide-in-from-bottom sm:slide-in-from-bottom-8">

                {/* Header */}
                <div className="sticky top-0 bg-[#1a1a1a]/90 backdrop-blur-md px-6 py-5 border-b border-white/10 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold font-white">🧾 Split the Bill</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">✕</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Summary */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Subtotal (Items)</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Taxes (5%)</span>
                            <span>₹{taxes.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Delivery Fee</span>
                            <span>₹{deliveryFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl text-white pt-3 border-t border-white/10">
                            <span>Grand Total</span>
                            <span className="text-brand-500">₹{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Split Type Toggle */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">How do you want to split?</label>
                        <div className="flex gap-2 p-1 bg-black/50 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setSplitType('even')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${splitType === 'even' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                            >
                                Split Evenly
                            </button>
                            <button
                                type="button"
                                onClick={() => setSplitType('exact')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${splitType === 'exact' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                            >
                                Pay per Item
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            {splitType === 'even' ? 'Taxes and delivery are divided evenly.' : 'Everyone pays exactly for what they ordered + an equal share of fees.'}
                        </p>
                    </div>

                    {/* Split Breakdown */}
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                        <label className="block text-sm font-semibold text-gray-300 mb-1">Who owes what:</label>
                        {participants.map(p => (
                            <div key={p} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                                        {p.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-sm text-white">{p}</span>
                                </div>
                                <span className="font-bold text-brand-400">₹{splits[p]?.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Checkout Form */}
                    <form onSubmit={handleCheckout} className="pt-4 border-t border-white/10">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Delivery Address (Host)</label>
                        <textarea
                            required
                            value={deliveryAddress}
                            onChange={e => setDeliveryAddress(e.target.value)}
                            placeholder="e.g. 123 Main St, Apt 4B"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none mb-6 resize-none h-20"
                        />

                        <button
                            type="submit"
                            disabled={loading || numPeople === 0}
                            className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                        >
                            {loading ? <span className="animate-spin">⏳</span> : `Place Order (₹${totalAmount.toFixed(2)})`}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    )
}
