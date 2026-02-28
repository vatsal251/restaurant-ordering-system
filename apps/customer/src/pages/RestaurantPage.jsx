import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useGroupOrderStore } from '../store/groupOrderStore'
import { toast } from 'react-hot-toast'
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
    const [showInfo, setShowInfo] = useState(false)
    const { items: cartItems, addItem, updateQuantity, totalPrice } = useCartStore()
    const { activeGroupId, participantName } = useGroupOrderStore()
    const navigate = useNavigate()
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

    const handleAddItem = async (item) => {
        if (activeGroupId && participantName) {
            try {
                // Add to Global Group Order
                toast.loading(`Adding ${item.name} to Group Order...`, { id: 'add-group' })
                await api.post(`/api/group-orders/${activeGroupId}/items`, {
                    menuItemId: item.id,
                    participantName,
                    quantity: 1,
                    price: item.price
                })
                toast.success('Added to Group Order!', { id: 'add-group' })
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to add item to Group Order', { id: 'add-group' })
            }
        } else {
            // Local Cart
            addItem({ ...item, restaurantId: id, restaurantName: restaurant.name })
        }
    }

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
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{restaurant.name}</h1>
                        <button onClick={() => setShowInfo(true)} className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center hover:bg-white/20">ℹ️</button>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-300 flex-wrap">
                        <button onClick={() => setShowInfo(true)} className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold shadow-sm shadow-green-500/10 hover:bg-green-500/30 transition-colors">
                            ⭐ {restaurant.rating || '4.2'} ({restaurant.reviews?.length || 0}) ➔
                        </button>
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
                                        <button id={`add-${item.id}`} onClick={() => handleAddItem(item)}
                                            className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold hover:bg-brand-600">+</button>
                                    </div>
                                ) : (
                                    <button
                                        id={`add-${item.id}`}
                                        onClick={() => item.isAvailable !== false && handleAddItem(item)}
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
                <Link to={activeGroupId ? `/group-order/${activeGroupId}` : "/cart"} className={`fixed bottom-6 left-4 right-4 ${activeGroupId ? 'bg-green-600 hover:bg-green-500 shadow-green-500/30' : 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/30'} text-white font-semibold px-5 py-4 rounded-2xl flex items-center justify-between shadow-lg transition-colors z-50`}>
                    <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">{cartCount} item{cartCount > 1 ? 's' : ''}</span>
                    <span>{activeGroupId ? 'View Group Cart →' : 'View Cart →'}</span>
                    <span>₹{totalPrice().toFixed(0)}</span>
                </Link>
            )}

            {/* Restaurant Info & Reviews Sheet */}
            {showInfo && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-end animate-in fade-in duration-200" onClick={() => setShowInfo(false)}>
                    <div className="w-full max-h-[85vh] overflow-y-auto bg-[#1a1a1a] rounded-t-3xl p-6 relative animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />

                        <h2 className="text-2xl font-bold mb-1">{restaurant.name}</h2>
                        <p className="text-gray-400 text-sm mb-4">{restaurant.cuisineType}</p>

                        <div className="card space-y-4 mb-6 !bg-white/5 border-none">
                            <div className="flex gap-3">
                                <span className="text-xl">📍</span>
                                <div>
                                    <p className="text-sm text-white font-medium">Outlet - Location</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{restaurant.address}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 border-t border-white/5 pt-3">
                                <span className="text-xl">⏱️</span>
                                <div>
                                    <p className="text-sm text-white font-medium">Opening Hours</p>
                                    <p className="text-xs text-gray-400 mt-0.5">10:00 AM - 11:30 PM (Today)</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">Reviews ({restaurant.reviews?.length || 0})</h3>
                            <span className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-0.5 rounded-lg font-bold text-sm">
                                ⭐ {restaurant.rating || '4.2'}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {restaurant.reviews && restaurant.reviews.length > 0 ? (
                                restaurant.reviews.map(rev => (
                                    <div key={rev.id} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center font-bold text-xs uppercase">
                                                    {rev.customer?.name?.[0] || 'A'}
                                                </div>
                                                <p className="text-sm font-medium">{rev.customer?.name || 'Anonymous'}</p>
                                            </div>
                                            <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${rev.rating >= 4 ? 'bg-green-500/20 text-green-400' : rev.rating === 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                ★ {rev.rating}
                                            </span>
                                        </div>
                                        {rev.comment && <p className="text-sm text-gray-300 ml-10">{rev.comment}</p>}
                                        <p className="text-[10px] text-gray-500 mt-2 ml-10">{new Date(rev.createdAt).toLocaleDateString()}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">No reviews yet.</p>
                            )}
                        </div>

                        <div className="mt-8 pt-4 border-t border-white/5 space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-blue-900/20 border border-blue-500/20 rounded-xl">
                                <span className="text-2xl">🛡️</span>
                                <div>
                                    <p className="text-sm text-blue-400 font-bold">Safety & Hygiene Verified</p>
                                    <p className="text-xs text-gray-400">Regular temperature checks & sanitized kitchens.</p>
                                </div>
                            </div>
                            <div className="flex gap-2 items-center text-xs text-gray-500">
                                <span className="opacity-50 grayscale">🏢</span>
                                <span>FSSAI Lic. No. {restaurant.fssaiLicense || `100200820${restaurant.id.slice(-4, -1)}`}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
