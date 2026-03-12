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
    const [recentSearches, setRecentSearches] = useState([])
    const searchTimeoutRef = useRef(null)

    const cart = useCartStore()

    // Update URL when query changes (debounced lightly)
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (query) {
                setSearchParams({ q: query }, { replace: true })
                // Save to recent searches
                setRecentSearches(prev => {
                    const updated = [query, ...prev.filter(q => q !== query)].slice(0, 5)
                    localStorage.setItem('recentSearches', JSON.stringify(updated))
                    return updated
                })
            } else {
                setSearchParams({}, { replace: true })
            }
        }, 800)
        return () => clearTimeout(timeout)
    }, [query, setSearchParams])

    // Load recent searches on mount
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('recentSearches'))
            if (saved) setRecentSearches(saved)
        } catch { }
    }, [])

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
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Search Top Bar */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 pt-3 pb-2 px-4 shadow-sm">
                <div className="flex gap-3 items-center">
                    <button onClick={() => navigate(-1)} className="text-xl w-8 text-gray-600 hover:text-gray-900 transition-colors">←</button>
                    <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search for restaurants or dishes"
                            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-gray-900 placeholder-gray-500 shadow-sm hover:shadow-md"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                                ✖
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                {query && (!loading || results.restaurants.length > 0 || results.items.length > 0) && (
                    <div className="flex gap-6 mt-4 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('restaurants')}
                            className={`pb-2 text-sm font-medium transition-colors border-b-2 relative top-[1px] ${activeTab === 'restaurants' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                        >
                            Restaurants ({results.restaurants.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('dishes')}
                            className={`pb-2 text-sm font-medium transition-colors border-b-2 relative top-[1px] ${activeTab === 'dishes' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                        >
                            Dishes ({results.items.length})
                        </button>
                    </div>
                )}
            </div>

            {/* Results Area */}
            <div className="px-4 pt-4">
                {!query ? (
                    <div className="mt-6 space-y-8">
                        {recentSearches.length > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Recent Searches</h2>
                                    <button onClick={() => { localStorage.removeItem('recentSearches'); setRecentSearches([]) }} className="text-xs text-brand-500 hover:underline">Clear</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {recentSearches.map(q => (
                                        <button key={q} onClick={() => setQuery(q)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1 transition-colors">
                                            <span className="opacity-70">🕒</span> {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Trending Deals</h2>
                            <div className="flex flex-wrap gap-2">
                                {['Pizza 🍕', 'Burger 🍔', 'Biryani 🍲', 'Chinese 🍜', 'Desserts 🍨', 'Healthy 🥗'].map(c => (
                                    <button key={c} onClick={() => setQuery(c.split(' ')[0])} className="px-4 py-2 rounded-full border border-gray-200 text-sm focus:bg-brand-50 text-gray-700 hover:bg-gray-50 transition-colors">
                                        <span className="text-brand-500 text-xs mr-1">🔥</span> {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : loading && results.restaurants.length === 0 && results.items.length === 0 ? (
                    <div className="space-y-4 mt-4">
                        {[1, 2, 3].map(i => <div key={i} className="bg-white border border-gray-100 shadow-sm rounded-xl h-24 animate-pulse" />)}
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
                                        <div className="bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md hover:border-gray-300 transition-all p-3 flex gap-4 items-start relative overflow-hidden">
                                            <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200 relative">
                                                {r.imageUrl ? <img src={r.imageUrl} className="w-full h-full object-cover" /> :
                                                    <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>}
                                                {r.isPromoted && <span className="absolute top-1 left-1 bg-white/90 text-gray-900 text-[9px] uppercase px-1.5 rounded backdrop-blur font-bold border border-gray-200">Ad</span>}
                                                {!r.isOpen && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="text-white text-[10px] font-bold">CLOSED</span></div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-gray-900 text-lg truncate flex items-center gap-1">
                                                        {r.name}
                                                        {r.isVegOnly && <span className="shrink-0 w-3 h-3 border border-green-600 p-0.5 flex justify-center items-center rounded-sm"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span></span>}
                                                    </h3>
                                                    <div className="flex items-center gap-1 text-[11px] text-white bg-green-600 px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                                                        {r.rating?.toFixed(1) || '4.2'} ⭐
                                                    </div>
                                                </div>
                                                <p className="truncate text-xs text-gray-500 mt-0.5">{r.cuisineType}</p>

                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    <span className="text-[10px] text-gray-600 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                                                        ⏱️ {r.deliveryTime || 30}m
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">₹{r.costForTwo || 500} for two</span>
                                                </div>

                                                {/* Offers / Order count */}
                                                <div className="mt-2 text-[10px] text-brand-600 font-medium">
                                                    {r.costForTwo < 400 ? '🏷️ Flat ₹100 OFF' : '🚀 Free Delivery available'}
                                                </div>
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
                                        <div key={item.id} className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 space-y-3 relative overflow-hidden">
                                            {/* Dish info */}
                                            <div className="flex justify-between items-start">
                                                <div className="pr-4">
                                                    <div className={`w-3 h-3 rounded-sm border mb-1.5 flex items-center justify-center ${item.category === 'Veg' ? 'border-green-500' : 'border-red-500'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${item.category === 'Veg' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    </div>
                                                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                                                    <p className="text-sm font-semibold text-gray-900 mt-1">₹{item.price}</p>

                                                    {/* Restaurant badge link */}
                                                    <Link to={`/restaurant/${item.restaurantId}`} className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg mt-3 hover:bg-gray-100 transition-colors">
                                                        <span className="text-xs text-brand-500">⭐ {item.restaurant.rating.toFixed(1)}</span>
                                                        <span className="text-xs text-gray-600 truncate max-w-[150px]">{item.restaurant.name} ➔</span>
                                                    </Link>
                                                </div>

                                                <div className="flex flex-col items-center">
                                                    {qty === 0 ? (
                                                        <button
                                                            onClick={() => handleAddToCart(item)}
                                                            className={`bg-brand-50 text-brand-600 border border-brand-200 px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-brand-500 hover:text-white transition-colors ${!item.restaurant.isOpen && 'opacity-50 pointer-events-none'}`}
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
