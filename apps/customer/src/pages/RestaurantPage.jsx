import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import api from '../lib/api'

export default function RestaurantPage() {
    const { id } = useParams()
    const [restaurant, setRestaurant] = useState(null)
    const [menu, setMenu] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterCat, setFilterCat] = useState('All')
    const { items: cartItems, addItem, updateQuantity, totalPrice } = useCartStore()

    useEffect(() => {
        Promise.all([
            api.get(`/api/restaurants/${id}`),
            api.get(`/api/restaurants/${id}/menu`)
        ]).then(([r, m]) => { setRestaurant(r.data); setMenu(m.data) })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [id])

    const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0)
    const categories = ['All', ...new Set(menu.map(i => i.category).filter(Boolean))]
    const filtered = filterCat === 'All' ? menu : menu.filter(i => i.category === filterCat)

    const getItemQty = (itemId) => {
        const found = cartItems.find(i => i.id === itemId)
        return found?.quantity || 0
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading…</div>
    if (!restaurant) return <div className="flex items-center justify-center min-h-screen text-gray-400">Restaurant not found</div>

    return (
        <div className="min-h-screen pb-32">
            {/* Header */}
            <div className="relative w-full h-52 bg-gradient-to-br from-brand-500/30 to-[#0f0f0f] flex items-end px-4 pb-4">
                {restaurant.imageUrl && <img src={restaurant.imageUrl} alt={restaurant.name} className="absolute inset-0 w-full h-full object-cover opacity-30" />}
                <Link to="/" className="absolute top-4 left-4 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white z-10">←</Link>
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold">{restaurant.name}</h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-300">
                        <span>⭐ {restaurant.rating || '4.2'}</span>
                        {restaurant.cuisineType && <span>• {restaurant.cuisineType}</span>}
                        <span className={`badge ${restaurant.isOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {restaurant.isOpen ? '● Open' : '● Closed'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Category filter */}
            {categories.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
                    {categories.map(c => (
                        <button key={c} onClick={() => setFilterCat(c)}
                            className={`whitespace-nowrap px-3 py-1 rounded-full text-sm transition-all ${filterCat === c ? 'bg-brand-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}>
                            {c}
                        </button>
                    ))}
                </div>
            )}

            {/* Menu */}
            <div className="px-4 pt-2 space-y-3">
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-3">📋</div>
                        <p>No menu items available</p>
                    </div>
                )}
                {filtered.map(item => (
                    <div key={item.id} className="card flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-medium">{item.name}</p>
                                {item.category && (
                                    <span className="text-xs bg-brand-500/10 text-brand-500 px-2 py-0.5 rounded-full shrink-0">{item.category}</span>
                                )}
                            </div>
                            {item.description && <p className="text-gray-400 text-sm mt-0.5 truncate">{item.description}</p>}
                            <p className="text-brand-500 font-semibold mt-1">₹{item.price}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {getItemQty(item.id) > 0 ? (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity(item.id, getItemQty(item.id) - 1)}
                                        className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center text-lg font-bold hover:bg-brand-500/40 transition-colors">
                                        −
                                    </button>
                                    <span className="font-semibold w-5 text-center">{getItemQty(item.id)}</span>
                                    <button id={`add-${item.id}`} onClick={() => addItem({ ...item, restaurantId: id })}
                                        className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-lg font-bold hover:bg-brand-600 transition-colors">
                                        +
                                    </button>
                                </div>
                            ) : (
                                <button id={`add-${item.id}`} onClick={() => addItem({ ...item, restaurantId: id })}
                                    className="btn-primary whitespace-nowrap text-sm px-4 py-2">
                                    + Add
                                </button>
                            )}
                        </div>
                    </div>
                ))}
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
