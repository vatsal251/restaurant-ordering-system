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
        <div className="min-h-screen pb-20 bg-gray-50 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-3 shadow-sm">
                <Link to="/profile" className="text-xl text-gray-600 hover:text-gray-900 transition-colors shrink-0">
                    ←
                </Link>
                <h1 className="text-xl font-bold text-gray-900">My Favourites</h1>
            </div>

            <div className="px-4 pt-6">
                {!user ? (
                    <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
                        <div className="text-6xl mb-4">🔒</div>
                        <h2 className="text-xl font-bold mb-2 text-gray-900">Login Required</h2>
                        <p className="text-gray-500 text-sm mb-6">Please login to save and view your favourite restaurants.</p>
                        <Link to="/login" className="bg-brand-500 hover:bg-brand-600 font-bold text-white shadow-md hover:shadow-lg transition-all px-8 py-3 rounded-xl inline-block">Login Now</Link>
                    </div>
                ) : loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white border border-gray-200 rounded-2xl animate-pulse h-48 shadow-sm">
                                <div className="w-full h-28 rounded-t-2xl bg-gray-100 mb-3" />
                                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2 mx-4" />
                            </div>
                        ))}
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
                        <div className="text-6xl mb-4">💔</div>
                        <h2 className="text-xl font-bold mb-2 text-gray-900">No Favourites Yet</h2>
                        <p className="text-gray-500 text-sm mb-6 font-medium">You haven't saved any restaurants to your favourites list.</p>
                        <Link to="/" className="bg-brand-50 hover:bg-brand-100 text-brand-600 font-bold px-8 py-3 rounded-xl border border-brand-200 inline-block transition-colors">Explore Restaurants</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {favorites.map(fav => {
                            const r = fav.restaurant
                            if (!r) return null

                            return (
                                <Link key={fav.id} to={`/restaurant/${r.id}`}>
                                    <div className="bg-white border border-gray-200 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer overflow-hidden p-0 relative group shadow-sm">
                                        <div className="w-full h-36 bg-gradient-to-br from-brand-50 to-orange-50 flex items-center justify-center text-5xl relative overflow-hidden border-b border-gray-100">
                                            {r.imageUrl
                                                ? <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                                                : <span>{CUISINE_EMOJI[r.cuisineType] || '🍽️'}</span>}

                                            {!r.isOpen && (
                                                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                                    <span className="text-gray-900 text-sm font-black uppercase tracking-wide bg-white/90 shadow-sm border border-gray-200 px-4 py-1.5 rounded-full">Closed</span>
                                                </div>
                                            )}

                                            {/* Remove Favorite Button */}
                                            <button
                                                onClick={(e) => removeFavorite(e, r.id)}
                                                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center border border-gray-200 shadow-sm transition-all hover:scale-110 hover:bg-white z-10 group-hover:shadow-md"
                                            >
                                                <span className="text-red-500 text-xl mt-0.5">♥</span>
                                            </button>
                                        </div>
                                        <div className="p-4 bg-white">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{r.name}</h3>
                                                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mt-1">{r.cuisineType}</p>
                                                </div>
                                                <div className="flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-md shrink-0 border border-green-200">
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
