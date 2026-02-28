import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { toast } from 'react-hot-toast'

export default function AIAssistant() {
    const { user } = useAuthStore()
    const [query, setQuery] = useState('')
    const [budget, setBudget] = useState('')
    const [loading, setLoading] = useState(false)
    const [recommendations, setRecommendations] = useState([])
    const [searched, setSearched] = useState(false)

    const handleAskAI = async (e) => {
        e.preventDefault()
        if (!query.trim()) return toast.error('Please enter what you are looking for')

        setLoading(true)
        setSearched(true)
        try {
            const res = await api.post('/api/ai/assistant', {
                query,
                budget: budget ? parseFloat(budget) : undefined
            })
            setRecommendations(res.data.recommendations || [])
            if (res.data.recommendations?.length === 0) {
                toast("No matching items found. Try a different query!", { icon: '🤔' })
            }
        } catch (error) {
            console.error('AI error:', error)
            toast.error(error.response?.data?.message || 'Failed to get recommendations. Please try again.')
            setRecommendations([])
        } finally {
            setLoading(false)
        }
    }

    const addToCart = async (item) => {
        try {
            await api.post('/api/customer/cart', {
                restaurantId: item.restaurant.id,
                menuItemId: item.id,
                quantity: 1,
            });
            toast.success(`Added ${item.name} to cart!`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add to cart');
        }
    }

    return (
        <div className="min-h-screen pb-20 bg-[#0f0f0f] text-white">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-[#0f0f0f]/80 backdrop-blur-md border-b border-white/5 pt-3 pb-3 px-4 shadow-md">
                <div className="flex items-center gap-3">
                    <Link to="/" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg hover:bg-white/10 transition">
                        ←
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-500 flex items-center gap-2">
                            ✨ AI Dietitian & Assistant
                        </h1>
                        <p className="text-xs text-brand-300">Powered by Gemini</p>
                    </div>
                </div>
            </div>

            {/* Chat/Search Area */}
            <div className="p-4">
                <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-5 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                    <form onSubmit={handleAskAI} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-1">What are you craving?</label>
                            <textarea
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="e.g., I want a high protein meal under 500 calories without dairy"
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none h-24"
                            />
                        </div>
                        <div className="flex gap-3 items-center">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-400 mb-1">Max Budget (₹) Optional</label>
                                <input
                                    type="number"
                                    value={budget}
                                    onChange={e => setBudget(e.target.value)}
                                    placeholder="No limit"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 mt-5 bg-gradient-to-r from-brand-500 to-purple-600 font-bold py-3 rounded-xl shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center gap-2"
                            >
                                {loading ? <span className="animate-spin text-xl">⏳</span> : 'Analyze Options ✨'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Results Area */}
            <div className="px-4">
                {loading && (
                    <div className="space-y-4 py-8 text-center animate-pulse">
                        <div className="text-4xl mb-4">🤖</div>
                        <p className="text-brand-400 font-semibold text-lg">AI is analyzing menus...</p>
                        <p className="text-sm text-gray-500">Calculating macros and reviewing ingredients</p>
                    </div>
                )}

                {!loading && searched && recommendations.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        <div className="text-4xl mb-3">😕</div>
                        <p>No suitable items matched your request.</p>
                        <p className="text-sm mt-1 text-gray-600">Try loosening your budget or changing the query.</p>
                    </div>
                )}

                {!loading && recommendations.length > 0 && (
                    <div className="space-y-5 pb-6">
                        <h2 className="font-bold text-lg border-b border-white/10 pb-2 flex items-center gap-2">
                            Top Recommendations 🏆
                        </h2>
                        {recommendations.map((item, idx) => (
                            <div key={item.id} className="relative bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                                {/* Rank badge */}
                                <div className="absolute top-0 left-0 bg-brand-500 text-white font-black text-xs px-3 py-1 rounded-br-xl shadow-md z-10">
                                    #{idx + 1} Match
                                </div>

                                <div className="p-4 pt-8">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{item.name}</h3>
                                            <p className="text-sm text-gray-400 mt-0.5">from {item.restaurant?.name}</p>
                                        </div>
                                        <div className="text-lg font-black text-brand-400">₹{item.price}</div>
                                    </div>

                                    {/* AI Reasoning */}
                                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 mb-4">
                                        <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">AI Reasoning</div>
                                        <p className="text-sm text-purple-50 leading-relaxed italic">"{item.aiReasoning}"</p>
                                    </div>

                                    {/* Macros */}
                                    {item.estimatedMacros && (
                                        <div className="grid grid-cols-4 gap-2 mb-5">
                                            <div className="bg-black/50 border border-white/5 rounded-lg p-2 text-center">
                                                <div className="text-[10px] text-gray-500 font-semibold mb-1">CALS</div>
                                                <div className="text-sm text-white font-bold">{item.estimatedMacros.calories}</div>
                                            </div>
                                            <div className="bg-black/50 border border-blue-500/20 rounded-lg p-2 text-center">
                                                <div className="text-[10px] text-blue-400 font-semibold mb-1">PRO</div>
                                                <div className="text-sm text-blue-100 font-bold">{item.estimatedMacros.protein}g</div>
                                            </div>
                                            <div className="bg-black/50 border border-yellow-500/20 rounded-lg p-2 text-center">
                                                <div className="text-[10px] text-yellow-400 font-semibold mb-1">CARBS</div>
                                                <div className="text-sm text-yellow-100 font-bold">{item.estimatedMacros.carbs}g</div>
                                            </div>
                                            <div className="bg-black/50 border border-red-500/20 rounded-lg p-2 text-center">
                                                <div className="text-[10px] text-red-400 font-semibold mb-1">FATS</div>
                                                <div className="text-sm text-red-100 font-bold">{item.estimatedMacros.fats}g</div>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => addToCart(item)}
                                        className="w-full bg-white text-black font-bold py-3 rounded-xl shadow-[0_4px_15px_rgba(255,255,255,0.2)] hover:bg-gray-100 transition-colors flex justify-center items-center gap-2"
                                    >
                                        Add to Cart 🛒
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
