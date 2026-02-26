import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { useCartStore } from '../store/cartStore'

export default function Search() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const initialQuery = searchParams.get('q') || ''
    const [query, setQuery] = useState(initialQuery)
    const [results, setResults] = useState({ restaurants: [], items: [] })
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('restaurants') // 'restaurants' | 'dishes'
    const searchTimeoutRef = useRef(null)

    const cart = useCartStore()

    // Update URL when query changes (debounced lightly)
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (query) setSearchParams({ q: query }, { replace: true })
            else setSearchParams({}, { replace: true })
        }, 300)
        return () => clearTimeout(timeout)
    }, [query, setSearchParams])

    useEffect(() => {
        if (!query.trim()) {
            setResults({ restaurants: [], items: [] })
            setLoading(false)
            return
        }

        setLoading(true)
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const { data } = await api.get(`/api/search?q=${encodeURIComponent(query)}`)
                setResults(data)
                // Auto-switch tab if one is empty but the other has results
                if (data.restaurants.length === 0 && data.items.length > 0) setActiveTab('dishes')
                else if (data.restaurants.length > 0 && data.items.length === 0) setActiveTab('restaurants')
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(searchTimeoutRef.current)
    }, [query])

    const handleAddToCart = (item) => {
        if (cart.restaurantId && cart.restaurantId !== item.restaurantId) {
            const confirmClear = window.confirm(`Your cart contains items from ${cart.restaurantName}. Clear cart and add ${item.name} from ${item.restaurant.name}?`)
            if (confirmClear) {
                cart.clearCart()
                cart.addItem({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    restaurantId: item.restaurant.id,
                    restaurantName: item.restaurant.name,
                })
            }
        } else {
            cart.addItem({
                id: item.id,
                name: item.name,
                price: item.price,
                restaurantId: item.restaurant.id,
                restaurantName: item.restaurant.name,
            })
        }
    }

    return (
        <div className="min-h-screen pb-20">
            {/* Search Top Bar */}
            <div className="sticky top-0 z-20 bg-[#0f0f0f] border-b border-white/5 pt-3 pb-2 px-4 shadow-sm shadow-black/50">
                <div className="flex gap-3 items-center">
                    <button onClick={() => navigate(-1)} className="text-xl w-8">←</button>
                    <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search for restaurants or dishes"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-10 text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                ✖
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                {query && (!loading || results.restaurants.length > 0 || results.items.length > 0) && (
                    <div className="flex gap-6 mt-4 border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('restaurants')}
                            className={`pb-2 text-sm font-medium transition-colors border-b-2 relative top-[1px] ${activeTab === 'restaurants' ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-400 hover:text-white'}`}
                        >
                            Restaurants ({results.restaurants.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('dishes')}
                            className={`pb-2 text-sm font-medium transition-colors border-b-2 relative top-[1px] ${activeTab === 'dishes' ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-400 hover:text-white'}`}
                        >
                            Dishes ({results.items.length})
                        </button>
                    </div>
                )}
            </div>

            {/* Results Area */}
            <div className="px-4 pt-4">
                {!query ? (
                    <div className="mt-10">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Popular Cuisines</h2>
                        <div className="flex flex-wrap gap-2">
                            {['Pizza 🍕', 'Burger 🍔', 'Biryani 🍲', 'Chinese 🍜', 'Desserts 🍨', 'Healthy 🥗'].map(c => (
                                <button key={c} onClick={() => setQuery(c.split(' ')[0])} className="px-4 py-2 rounded-full border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : loading && results.restaurants.length === 0 && results.items.length === 0 ? (
                    <div className="space-y-4 mt-4">
                        {[1, 2, 3].map(i => <div key={i} className="card h-24 animate-pulse" />)}
                    </div>
                ) : (
                    <div className="mt-2 space-y-4">
                        {/* RESTAURANTS TAB */}
                        {activeTab === 'restaurants' && (
                            results.restaurants.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">
                                    <p className="text-4xl mb-3">🍽️</p>
                                    <p>No restaurants found for "{query}"</p>
                                </div>
                            ) : (
                                results.restaurants.map(r => (
                                    <Link key={r.id} to={`/restaurant/${r.id}`} className="block">
                                        <div className="card hover:scale-[1.01] transition-transform p-3 flex gap-4 items-center">
                                            <div className="w-16 h-16 rounded-xl bg-[#1a1a1a] flex-shrink-0 overflow-hidden border border-white/5">
                                                {r.imageUrl ? <img src={r.imageUrl} className="w-full h-full object-cover" /> :
                                                    <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-lg truncate">{r.name}</h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                    <span className="flex items-center gap-0.5 text-Brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded text-brand-500 font-bold">
                                                        ⭐ {r.rating.toFixed(1)}
                                                    </span>
                                                    <span className="truncate">{r.cuisineType}</span>
                                                </div>
                                                <p className={`text-xs mt-1 ${r.isOpen ? 'text-gray-400' : 'text-red-400'}`}>
                                                    {r.isOpen ? 'Takes ~30 mins' : 'Currently Closed'}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )
                        )}

                        {/* DISHES TAB */}
                        {activeTab === 'dishes' && (
                            results.items.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">
                                    <p className="text-4xl mb-3">🍲</p>
                                    <p>No dishes found for "{query}"</p>
                                </div>
                            ) : (
                                results.items.map(item => {
                                    const qty = cart.items.find(i => i.id === item.id)?.quantity || 0
                                    return (
                                        <div key={item.id} className="card p-4 space-y-3 relative overflow-hidden">
                                            {/* Dish info */}
                                            <div className="flex justify-between items-start">
                                                <div className="pr-4">
                                                    <div className={`w-3 h-3 rounded-sm border mb-1.5 flex items-center justify-center ${item.category === 'Veg' ? 'border-green-500' : 'border-red-500'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${item.category === 'Veg' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    </div>
                                                    <h3 className="font-bold text-white">{item.name}</h3>
                                                    <p className="text-sm font-semibold text-white mt-1">₹{item.price}</p>

                                                    {/* Restaurant badge link */}
                                                    <Link to={`/restaurant/${item.restaurantId}`} className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-1 rounded-lg mt-3 hover:bg-white/10 transition-colors">
                                                        <span className="text-xs text-brand-500">⭐ {item.restaurant.rating.toFixed(1)}</span>
                                                        <span className="text-xs text-gray-300 truncate max-w-[150px]">{item.restaurant.name} ➔</span>
                                                    </Link>
                                                </div>

                                                <div className="flex flex-col items-center">
                                                    {qty === 0 ? (
                                                        <button
                                                            onClick={() => handleAddToCart(item)}
                                                            className={`bg-white/10 text-brand-500 border border-brand-500/20 px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-brand-500/20 transition-colors ${!item.restaurant.isOpen && 'opacity-50 pointer-events-none'}`}
                                                        >
                                                            Add
                                                        </button>
                                                    ) : (
                                                        <div className="bg-brand-500 text-white flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20">
                                                            <button onClick={() => cart.updateQuantity(item.id, qty - 1)} className="w-5 hover:opacity-70">−</button>
                                                            <span>{qty}</span>
                                                            <button onClick={() => cart.updateQuantity(item.id, qty + 1)} className="w-5 hover:opacity-70">+</button>
                                                        </div>
                                                    )}
                                                    {!item.restaurant.isOpen && <p className="text-[10px] text-red-400 mt-2 font-medium">CLOSED</p>}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )
                        )}
                    </div>
                )}
            </div>

            {/* View Cart Pill */}
            {cart.items.length > 0 && (
                <div className="fixed bottom-4 left-4 right-4 z-50">
                    <Link to="/cart" className="bg-brand-500 text-white rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-brand-500/20 font-bold hover:bg-brand-400 transition-colors">
                        <span>{cart.items.reduce((a, b) => a + b.quantity, 0)} items | ₹{cart.totalPrice()}</span>
                        <span>View Cart ➔</span>
                    </Link>
                </div>
            )}
        </div>
    )
}
