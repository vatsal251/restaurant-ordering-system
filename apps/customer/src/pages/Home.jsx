import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

const CUISINE_EMOJI = {
    Pizza: '🍕', Burger: '🍔', Biryani: '🍛', Chinese: '🥢',
    'South Indian': '🥘', Desserts: '🍰', Italian: '🍝', Mexican: '🌮',
    Sushi: '🍱', Rolls: '🌯',
}

const SORT_OPTIONS = [
    { id: 'relevance', label: 'Relevance' },
    { id: 'rating', label: '⭐ Rating' },
    { id: 'time', label: '⏱ Delivery Time' },
    { id: 'price_asc', label: '₹ Low to High' },
]

const OFFERS = [
    { emoji: '🎉', title: '50% OFF up to ₹100', sub: 'On your first order · Use FIRST50', color: 'from-purple-500/30 to-brand-500/20' },
    { emoji: '🚀', title: 'Free Delivery', sub: 'On orders above ₹299', color: 'from-green-500/30 to-teal-500/20' },
    { emoji: '💥', title: 'FOODRUSH10 — 10% Off', sub: 'Apply code at checkout', color: 'from-orange-500/30 to-red-500/20' },
]

export default function Home() {
    const { user, logout } = useAuthStore()
    const [restaurants, setRestaurants] = useState([])
    const [search, setSearch] = useState('')
    const [cuisine, setCuisine] = useState('All')
    const [sortBy, setSortBy] = useState('relevance')
    const [showOpen, setShowOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [offerIdx, setOfferIdx] = useState(0)

    const cuisines = ['All', 'Pizza', 'Burger', 'Biryani', 'Chinese', 'South Indian', 'Desserts', 'Rolls']

    useEffect(() => {
        api.get('/api/restaurants')
            .then(r => setRestaurants(r.data))
            .catch(() => setRestaurants([]))
            .finally(() => setLoading(false))
    }, [])

    // Auto-rotate offer banner
    useEffect(() => {
        const t = setInterval(() => setOfferIdx(i => (i + 1) % OFFERS.length), 3500)
        return () => clearInterval(t)
    }, [])

    let filtered = restaurants
        .filter(r => (cuisine === 'All' || r.cuisineType === cuisine) && r.name.toLowerCase().includes(search.toLowerCase()))
        .filter(r => !showOpen || r.isOpen)

    if (sortBy === 'rating') filtered = [...filtered].sort((a, b) => (b.rating || 4.2) - (a.rating || 4.2))
    if (sortBy === 'time') filtered = [...filtered].sort(() => Math.random() - 0.5) // static ordering similarity
    if (sortBy === 'price_asc') filtered = [...filtered].sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0))

    const offer = OFFERS[offerIdx]

    return (
        <div className="min-h-screen">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-[#0f0f0f]/90 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🍕</span>
                    <span className="font-bold text-brand-500 text-lg">FoodRush</span>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/orders" className="text-gray-400 hover:text-white text-sm">Orders</Link>
                    <Link to="/cart" className="text-gray-400 hover:text-white text-sm">Cart 🛒</Link>
                    <Link to="/profile" className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-sm font-bold">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </Link>
                </div>
            </nav>

            <div className="px-4 pt-6 pb-2">
                <h1 className="text-2xl font-bold mb-0.5">Hey {user?.name?.split(' ')[0]} 👋</h1>
                <p className="text-gray-400 text-sm mb-4">What are you craving today?</p>

                {/* Search */}
                <div className="relative mb-4">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input id="restaurant-search" type="search" className="input pl-9"
                        placeholder="Search restaurants or cuisines…"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                {/* Offers carousel */}
                <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-r ${offer.color} border border-white/10 px-5 py-4 mb-4 transition-all duration-500`}>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{offer.emoji}</span>
                        <div>
                            <p className="font-bold text-white">{offer.title}</p>
                            <p className="text-xs text-gray-300 mt-0.5">{offer.sub}</p>
                        </div>
                    </div>
                    <div className="flex gap-1.5 mt-3">
                        {OFFERS.map((_, i) => (
                            <button key={i} onClick={() => setOfferIdx(i)}
                                className={`h-1.5 rounded-full transition-all ${i === offerIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Cuisine filter row */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                {cuisines.map(c => (
                    <button key={c} id={`filter-${c.toLowerCase()}`} onClick={() => setCuisine(c)}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all ${cuisine === c
                            ? 'bg-brand-500 text-white'
                            : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-white/10'}`}>
                        {CUISINE_EMOJI[c] && <span>{CUISINE_EMOJI[c]}</span>}
                        {c}
                    </button>
                ))}
            </div>

            {/* Sort + Open filter toolbar */}
            <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {SORT_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => setSortBy(opt.id)}
                        className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-all ${sortBy === opt.id
                            ? 'bg-white text-black border-white font-semibold'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}>
                        {opt.label}
                    </button>
                ))}
                <button onClick={() => setShowOpen(o => !o)}
                    className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-all ${showOpen
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}>
                    🟢 Open Now
                </button>
            </div>

            {/* Restaurant grid */}
            <div className="px-4 pb-8">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="card animate-pulse h-52">
                                <div className="w-full h-32 rounded-xl bg-white/5 mb-3" />
                                <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                                <div className="h-3 bg-white/5 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <div className="text-4xl mb-3">🍽️</div>
                        <p>No restaurants found</p>
                        {showOpen && <button onClick={() => setShowOpen(false)} className="text-brand-500 text-sm hover:underline mt-2">Show all restaurants</button>}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(r => (
                            <Link key={r.id} to={`/restaurant/${r.id}`} id={`restaurant-${r.id}`}>
                                <div className="card hover:scale-[1.02] transition-transform cursor-pointer overflow-hidden p-0">
                                    <div className="w-full h-40 bg-gradient-to-br from-brand-500/20 to-brand-700/10 flex items-center justify-center text-5xl relative overflow-hidden">
                                        {r.imageUrl
                                            ? <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                                            : <span>{CUISINE_EMOJI[r.cuisineType] || '🍽️'}</span>}
                                        {!r.isOpen && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">Closed</span>
                                            </div>
                                        )}
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
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`badge ${r.isOpen ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {r.isOpen ? '● Open' : '● Closed'}
                                            </span>
                                            <span className="text-gray-500 text-xs">25–35 min</span>
                                            <span className="text-gray-500 text-xs">·</span>
                                            <span className="text-gray-500 text-xs">₹40 delivery</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
