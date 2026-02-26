import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import api from '../lib/api'

const VEG_DOT = ({ isVeg }) => (
    <span className={`inline-flex items-center justify-center w-4 h-4 border-2 rounded-sm shrink-0 ${isVeg ? 'border-green-500' : 'border-red-500'}`}>
        <span className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
    </span>
)

export default function RestaurantPage() {
    const { id } = useParams()
    const [restaurant, setRestaurant] = useState(null)
    const [menu, setMenu] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterCat, setFilterCat] = useState('All')
    const [vegFilter, setVegFilter] = useState('all') // 'all' | 'veg' | 'nonveg'
    const [searchQuery, setSearchQuery] = useState('')
    const [isFav, setIsFav] = useState(false)
    const { items: cartItems, addItem, updateQuantity, totalPrice } = useCartStore()
    const user = api.defaults.headers.common['Authorization'] ? true : false // rough check if logged in

    useEffect(() => {
        Promise.all([
            api.get(`/api/restaurants/${id}`),
            api.get(`/api/restaurants/${id}/menu`)
        ]).then(([r, m]) => { setRestaurant(r.data); setMenu(m.data) })
            .catch(() => { })
            .finally(() => setLoading(false))

        // Check if favorite
        api.get('/api/customer/favorites')
            .then(res => setIsFav(res.data.some(f => f.restaurantId === id)))
            .catch(() => { })
    }, [id])

    const toggleFav = async () => {
        const next = !isFav
        setIsFav(next)
        try {
            if (next) await api.post('/api/customer/favorites', { restaurantId: id })
            else await api.delete(`/api/customer/favorites/${id}`)
        } catch {
            setIsFav(!next) // revert
        }
    }

    const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0)
    const categories = ['All', ...new Set(menu.map(i => i.category).filter(Boolean))]

    const filtered = menu.filter(item => {
        const matchCat = filterCat === 'All' || item.category === filterCat
        const matchVeg = vegFilter === 'all'
            || (vegFilter === 'veg' && item.isVeg)
            || (vegFilter === 'nonveg' && !item.isVeg)
        const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchCat && matchVeg && matchSearch
    })

    // Group: recommended (top items shown first)
    const recommended = menu.filter(i => i.isAvailable !== false).slice(0, 3)

    const getItemQty = (itemId) => cartItems.find(i => i.id === itemId)?.quantity || 0

    if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading…</div>
    if (!restaurant) return <div className="flex items-center justify-center min-h-screen text-gray-400">Restaurant not found</div>

    return (
        <div className="min-h-screen pb-32">
            {/* Hero Header */}
            <div className="relative w-full h-52 bg-gradient-to-br from-brand-500/30 to-[#0f0f0f] flex items-end px-4 pb-4 overflow-hidden">
                {restaurant.imageUrl && (
                    <img src={restaurant.imageUrl} alt={restaurant.name} className="absolute inset-0 w-full h-full object-cover opacity-30" />
                )}

                {/* Top Nav actions */}
                <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
                    <Link to="/" className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-black/80 transition-colors">←</Link>
                    <button onClick={toggleFav} className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:bg-black/80 transition-all hover:scale-105">
                        <span className={`text-xl transition-colors ${isFav ? 'text-brand-500 drop-shadow-[0_0_8px_rgba(255,107,107,0.8)]' : 'text-white drop-shadow-md'}`}>
                            {isFav ? '♥' : '♡'}
                        </span>
                    </button>
                </div>

                <div className="relative z-10 w-full">
                    <h1 className="text-2xl font-bold">{restaurant.name}</h1>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-300 flex-wrap">
                        <span className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold shadow-sm shadow-green-500/10">
                            ⭐ {restaurant.rating || '4.2'}
                        </span>
                        {restaurant.cuisineType && <span className="text-gray-400">• {restaurant.cuisineType}</span>}
                        <span className="text-gray-400">• 25–35 min</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${restaurant.isOpen ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {restaurant.isOpen ? '● Open Now' : '● Closed'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Search within menu */}
            <div className="px-4 pt-3 pb-1">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="search"
                        placeholder="Search items in this menu…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="input pl-9 text-sm"
                    />
                </div>
            </div>

            {/* Veg / Non-Veg filter */}
            <div className="flex items-center gap-2 px-4 py-2">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'veg', label: '🟢 Veg' },
                    { id: 'nonveg', label: '🔴 Non-Veg' },
                ].map(opt => (
                    <button key={opt.id} onClick={() => setVegFilter(opt.id)}
                        className={`px-3 py-1 rounded-full text-sm border transition-all ${vegFilter === opt.id
                            ? 'bg-brand-500 text-white border-brand-500'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}>
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Category pills */}
            {categories.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-2">
                    {categories.map(c => (
                        <button key={c} onClick={() => setFilterCat(c)}
                            className={`whitespace-nowrap px-3 py-1 rounded-full text-sm transition-all ${filterCat === c
                                ? 'bg-white/20 text-white'
                                : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}>
                            {c}
                        </button>
                    ))}
                </div>
            )}

            {/* Recommended section (no filter applied) */}
            {!searchQuery && filterCat === 'All' && vegFilter === 'all' && recommended.length > 0 && (
                <div className="px-4 mb-2">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">🔥 Recommended</h2>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                        {recommended.map(item => (
                            <div key={item.id} className="shrink-0 w-36 bg-white/5 rounded-2xl overflow-hidden border border-white/10">
                                <div className="h-20 bg-gradient-to-br from-brand-500/20 to-transparent flex items-center justify-center text-3xl">
                                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : '🍽️'}
                                </div>
                                <div className="p-2">
                                    <p className="text-xs font-medium truncate">{item.name}</p>
                                    <p className="text-brand-500 text-xs font-semibold mt-0.5">₹{item.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Menu list */}
            <div className="px-4 pt-2 space-y-2">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-3">🔍</div>
                        <p>No items found</p>
                    </div>
                ) : (
                    filtered.map(item => (
                        <div key={item.id} className={`card flex items-center gap-4 ${item.isAvailable === false ? 'opacity-50' : ''}`}>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <VEG_DOT isVeg={item.isVeg !== false} />
                                    <p className="font-medium truncate">{item.name}</p>
                                </div>
                                {item.description && <p className="text-gray-400 text-sm truncate">{item.description}</p>}
                                <p className="text-brand-500 font-semibold mt-1">₹{item.price}</p>
                                {item.isAvailable === false && <p className="text-xs text-red-400 mt-0.5">Currently unavailable</p>}
                            </div>
                            {item.imageUrl && (
                                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                            )}
                            <div className="flex flex-col items-center gap-1 shrink-0">
                                {getItemQty(item.id) > 0 ? (
                                    <div className="flex items-center gap-1.5">
                                        <button onClick={() => updateQuantity(item.id, getItemQty(item.id) - 1)}
                                            className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center font-bold hover:bg-brand-500/40">−</button>
                                        <span className="font-semibold w-4 text-center text-sm">{getItemQty(item.id)}</span>
                                        <button id={`add-${item.id}`} onClick={() => addItem({ ...item, restaurantId: id })}
                                            className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold hover:bg-brand-600">+</button>
                                    </div>
                                ) : (
                                    <button
                                        id={`add-${item.id}`}
                                        onClick={() => item.isAvailable !== false && addItem({ ...item, restaurantId: id })}
                                        disabled={item.isAvailable === false}
                                        className="btn-primary text-sm px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        + Add
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating cart bar */}
            {cartCount > 0 && (
                <Link to="/cart" className="fixed bottom-6 left-4 right-4 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-4 rounded-2xl flex items-center justify-between shadow-lg shadow-brand-500/30 transition-colors z-50">
                    <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">{cartCount} item{cartCount > 1 ? 's' : ''}</span>
                    <span>View Cart →</span>
                    <span>₹{totalPrice().toFixed(0)}</span>
                </Link>
            )}
        </div>
    )
}
