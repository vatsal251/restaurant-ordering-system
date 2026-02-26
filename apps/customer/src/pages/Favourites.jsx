import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

const CUISINE_EMOJI = {
    Pizza: '🍕', Burger: '🍔', Biryani: '🍛', Chinese: '🥢',
    'South Indian': '🥘', Desserts: '🍰', Italian: '🍝', Mexican: '🌮',
    Sushi: '🍱', Rolls: '🌯',
}

export default function Favourites() {
    const { user } = useAuthStore()
    const [favorites, setFavorites] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return setLoading(false)
        api.get('/api/customer/favorites')
            .then(res => setFavorites(res.data))
            .catch(() => setFavorites([]))
            .finally(() => setLoading(false))
    }, [user])

    const removeFavorite = async (e, id) => {
        e.preventDefault()
        e.stopPropagation()

        // Optimistic update
        const prev = [...favorites]
        setFavorites(favorites.filter(f => f.restaurant.id !== id))

        try {
            await api.delete(`/api/customer/favorites/${id}`)
        } catch {
            setFavorites(prev) // Revert on failure
        }
    }

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-[#0f0f0f] border-b border-white/5 px-4 py-4 flex items-center gap-3">
                <Link to="/profile" className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-white/10 transition-colors">
                    ←
                </Link>
                <h1 className="text-xl font-bold">My Favourites</h1>
            </div>

            <div className="px-4 pt-6">
                {!user ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🔒</div>
                        <h2 className="text-xl font-bold mb-2">Login Required</h2>
                        <p className="text-gray-400 text-sm mb-6">Please login to save and view your favourite restaurants.</p>
                        <Link to="/login" className="btn-primary px-8 py-3">Login Now</Link>
                    </div>
                ) : loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="card animate-pulse h-48">
                                <div className="w-full h-28 rounded-xl bg-white/5 mb-3" />
                                <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                            </div>
                        ))}
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">💔</div>
                        <h2 className="text-xl font-bold mb-2">No Favourites Yet</h2>
                        <p className="text-gray-400 text-sm mb-6">You haven't saved any restaurants to your favourites list.</p>
                        <Link to="/" className="btn-primary px-8 py-3">Explore Restaurants</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {favorites.map(fav => {
                            const r = fav.restaurant
                            if (!r) return null // Edge case if restaurant was deleted

                            return (
                                <Link key={fav.id} to={`/restaurant/${r.id}`}>
                                    <div className="card hover:scale-[1.02] transition-transform cursor-pointer overflow-hidden p-0 relative group">
                                        <div className="w-full h-32 bg-gradient-to-br from-brand-500/20 to-brand-700/10 flex items-center justify-center text-4xl relative overflow-hidden">
                                            {r.imageUrl
                                                ? <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                                                : <span>{CUISINE_EMOJI[r.cuisineType] || '🍽️'}</span>}

                                            {!r.isOpen && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                    <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">Closed</span>
                                                </div>
                                            )}

                                            {/* Remove Favorite Button */}
                                            <button
                                                onClick={(e) => removeFavorite(e, r.id)}
                                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center border border-white/20 transition-all hover:scale-110 hover:bg-black/80 z-10"
                                            >
                                                <span className="text-brand-500 text-lg drop-shadow-[0_0_5px_rgba(255,107,107,0.5)]">♥</span>
                                            </button>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-white">{r.name}</h3>
                                                    <p className="text-gray-400 text-sm">{r.cuisineType}</p>
                                                </div>
                                                <div className="flex items-center gap-1 bg-green-500/10 text-green-400 text-sm px-2 py-0.5 rounded-full shrink-0">
                                                    ⭐ {r.rating || '4.2'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
