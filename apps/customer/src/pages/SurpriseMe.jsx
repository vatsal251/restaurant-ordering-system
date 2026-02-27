import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

const MOODS = [
    { id: 'comforting', label: 'Comforting 🍲', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { id: 'healthy', label: 'Healthy 🥗', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { id: 'spicy', label: 'Spicy 🔥', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    { id: 'sweet', label: 'Sweet 🍰', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
    { id: 'cheat', label: 'Cheat Meal 🍔', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { id: 'light', label: 'Light Bite 🥟', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
]

const BUDGETS = [150, 300, 500, 1000]

export default function SurpriseMe() {
    const navigate = useNavigate()
    const { user } = useAuthStore()

    const [mood, setMood] = useState('')
    const [budget, setBudget] = useState(300)
    const [address, setAddress] = useState(user?.address || '')
    const [phone, setPhone] = useState(user?.phone || '')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSurprise = async () => {
        if (!mood) return setError('Please select a mood!')
        if (!address.trim()) return setError('Delivery address is required.')

        setLoading(true)
        setError('')

        try {
            const { data } = await api.post('/api/surprise', {
                mood,
                budget,
                deliveryAddress: address,
                phone
            })
            // data.order, data.surpriseItem
            // Navigate directly to tracking to maintain the surprise until they look at the receipt
            navigate(`/orders/${data.order.id}`)
        } catch (err) {
            setError(err.response?.data?.message || 'Could not find a surprise meal matching your criteria.')
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4 px-4 text-center">
                <div className="text-6xl animate-bounce">🎲</div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-brand-400 to-yellow-400 bg-clip-text text-transparent animate-pulse">
                    Finding the perfect meal...
                </h2>
                <p className="text-gray-400 text-sm">Consulting our culinary experts and AI...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-32">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/5 flex items-center gap-3 px-4 py-3">
                <Link to="/" className="text-xl">←</Link>
                <h1 className="font-bold text-lg">Surprise Me 🎲</h1>
            </div>

            <div className="px-4 pt-6 space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Can't decide what to eat?</h2>
                    <p className="text-sm text-gray-400">Tell us your mood and budget. We'll pick a highly-rated dish and deliver it to you. No scrolling, just eating.</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}

                {/* 1. Mood */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-lg">1. How are you feeling?</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {MOODS.map(m => (
                            <button
                                key={m.id}
                                onClick={() => setMood(m.id)}
                                className={`py-4 rounded-xl border text-sm font-medium transition-all ${mood === m.id
                                        ? `${m.color} ring-2 ring-white/20 scale-[1.02]`
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                                    }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Budget */}
                <div className="space-y-3 pt-2">
                    <h3 className="font-semibold text-lg flex justify-between">
                        <span>2. Max Budget</span>
                        <span className="text-brand-500">₹{budget}</span>
                    </h3>
                    <input
                        type="range"
                        min="100"
                        max="2000"
                        step="50"
                        value={budget}
                        onChange={e => setBudget(Number(e.target.value))}
                        className="w-full accent-brand-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between gap-2 mt-4">
                        {BUDGETS.map(b => (
                            <button
                                key={b}
                                onClick={() => setBudget(b)}
                                className={`flex-1 py-1.5 rounded-lg border text-xs transition-colors ${budget === b ? 'bg-brand-500/20 border-brand-500 text-brand-500' : 'border-white/10 hover:border-white/30 text-gray-400'
                                    }`}
                            >
                                ₹{b}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Delivery Details */}
                <div className="card space-y-3 mt-4">
                    <h3 className="font-semibold text-sm">3. Delivery Details</h3>
                    <textarea
                        className="input resize-none h-20 text-sm"
                        placeholder="Full delivery address..."
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                    />
                    <input
                        type="tel"
                        className="input text-sm"
                        placeholder="Phone number"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                    />
                </div>
            </div>

            {/* Sticky Action Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f0f0f] to-transparent pt-10 pointer-events-none">
                <button
                    onClick={handleSurprise}
                    disabled={!mood || loading}
                    className="btn-primary w-full py-4 text-lg font-bold shadow-[0_0_20px_#f9731666] pointer-events-auto disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                >
                    🎲 Order Surprise Item
                </button>
            </div>
        </div>
    )
}
