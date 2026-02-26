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

    const [favorites, setFavorites] = useState(new Set())

    useEffect(() => {
        api.get('/api/restaurants')
            .then(r => setRestaurants(r.data))
            .catch(() => setRestaurants([]))
            .finally(() => setLoading(false))

        if (user) {
            api.get('/api/customer/favorites')
                .then(res => setFavorites(new Set(res.data.map(f => f.restaurantId))))
                .catch(() => { })
        }
    }, [user])

    // Auto-rotate offer banner
    useEffect(() => {
        const t = setInterval(() => setOfferIdx(i => (i + 1) % OFFERS.length), 3500)
        return () => clearInterval(t)
    }, [])

    const toggleFavorite = async (e, id) => {
        e.preventDefault() // prevent navigating to restaurant page
        e.stopPropagation()
        if (!user) return alert('Please login to save favorites')

        const isFav = favorites.has(id)
        const next = new Set(favorites)
        if (isFav) next.delete(id)
        else next.add(id)
        setFavorites(next)

        try {
            if (isFav) await api.delete(`/api/customer/favorites/${id}`)
            else await api.post('/api/customer/favorites', { restaurantId: id })
        } catch {
            setFavorites(favorites) // revert on fail
        }
    }

    let filtered = restaurants
        .filter(r => (cuisine === 'All' || r.cuisineType === cuisine) && r.name.toLowerCase().includes(search.toLowerCase()))
        .filter(r => !showOpen || r.isOpen)

    if (sortBy === 'rating') filtered = [...filtered].sort((a, b) => (b.rating || 4.2) - (a.rating || 4.2))
    if (sortBy === 'time') filtered = [...filtered].sort(() => Math.random() - 0.5) // static ordering similarity
    if (sortBy === 'price_asc') filtered = [...filtered].sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0))

    const offer = OFFERS[offerIdx]

    const [locationName, setLocationName] = useState('Locating...')
    const [subLocation, setSubLocation] = useState('Fetching your current location')

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationName('Location disabled')
            setSubLocation('Please enable location services')
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                    const data = await res.json()

                    if (data && data.address) {
                        const city = data.address.city || data.address.town || data.address.state_district || 'Unknown City'
                        const area = data.address.suburb || data.address.neighbourhood || data.address.road || 'Delivering to your current location'
                        setLocationName(city)
                        setSubLocation(area)
                    } else {
                        setLocationName('Location found')
                        setSubLocation('Unable to resolve address')
                    }
                } catch (error) {
                    setLocationName('Network error')
                    setSubLocation('Cannot fetch location details')
                }
            },
            (error) => {
                setLocationName('Use saved address')
                setSubLocation('Location permission denied')
            },
            { timeout: 10000 }
        )
    }, [])

    return (
        <div className="min-h-screen pb-20">
            {/* Top Bar (Sticky) */}
            <div className="sticky top-0 z-20 bg-[#0f0f0f] border-b border-white/5 pt-3 pb-2 px-4 shadow-sm shadow-black/50">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <div className="flex items-center gap-1.5 text-brand-500 font-bold">
                            <span className="text-xl">📍</span>
                            <span className="text-lg">{locationName}</span>
                            <span>▽</span>
                        </div>
                        <p className="text-gray-400 text-sm truncate w-48 mt-0.5">{subLocation}</p>
                    </div>
                    {user ? (
                        <div className="flex items-center gap-3">
                            <span className="text-brand-500 font-bold bg-brand-500/10 px-3 py-1.5 rounded-full border border-brand-500/20 shadow-[0_0_10px_rgba(255,107,107,0.1)]">
                                {user.name.split(' ')[0]}
                            </span>
                            <Link to="/profile" className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-xl border border-white/10 hover:border-brand-500/50 transition-colors">
                                👤
                            </Link>
                        </div>
                    ) : (
                        <Link to="/login" className="btn-primary px-5 py-2 text-sm">Login</Link>
                    )}
                </div>

                {/* Simulated search bar -> redirects to /search */}
                <Link to="/search" className="block relative mb-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                    <div className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-9 pr-4 text-sm text-gray-400 font-medium">
                        Search for "Pizza"
                    </div>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500 font-bold">| 🎙️</span>
                </Link>

                {/* Surprise Me Feature Link */}
                <Link to="/surprise" className="block mt-3 bg-gradient-to-r from-orange-600 to-yellow-500 rounded-xl p-4 text-white hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(249,115,22,0.3)] border border-white/20">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">Can't Decide What to Eat? 🎲</h3>
                            <p className="text-sm text-white/90 mt-0.5">Try our Mood-based Surprise Meal</p>
                        </div>
                        <span className="text-3xl drop-shadow-md">🍲</span>
                    </div>
                </Link>

                {/* Quick actions: Orders & Cart */}
                {user && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                        <Link to="/orders" className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                            <span>🧾</span>
                            <span className="font-semibold text-sm">My Orders</span>
                        </Link>
                        <Link to="/cart" className="bg-brand-500/10 border border-brand-500/20 text-brand-500 rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-brand-500/20 transition-colors">
                            <span>🛒</span>
                            <span className="font-semibold text-sm">Cart</span>
                        </Link>
                    </div>
                )}
            </div>

            {/* Auto-rotating Promo Carousel */}
            <div className="px-4 py-4">
                <div className={`w-full overflow-hidden rounded-2xl bg-gradient-to-r ${offer.color} p-5 relative border border-white/10 shadow-lg`}>
                    <div className="flex justify-between items-center relative z-10 transition-all duration-500">
                        <div>
                            <p className="text-xs uppercase tracking-wider font-bold text-white/70 mb-1">Special Offer</p>
                            <h2 className="text-2xl font-black text-white leading-tight">{offer.title}</h2>
                            <p className="text-sm font-medium text-white/80 mt-1">{offer.sub}</p>
                            <button className="mt-3 bg-white text-black text-xs font-bold px-4 py-1.5 rounded-full shadow-md">ORDER NOW</button>
                        </div>
                        <div className="text-5xl ml-4 drop-shadow-xl">{offer.emoji}</div>
                    </div>
                    {/* Progress dots */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {OFFERS.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === offerIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/30'}`} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Horizontal Categories */}
            <div className="px-4 py-2 flex items-center gap-4 overflow-x-auto scrollbar-hide">
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
                                <div className="card hover:scale-[1.02] transition-transform cursor-pointer overflow-hidden p-0 relative group">
                                    <div className="w-full h-40 bg-gradient-to-br from-brand-500/20 to-brand-700/10 flex items-center justify-center text-5xl relative overflow-hidden">
                                        {r.imageUrl
                                            ? <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                                            : <span>{CUISINE_EMOJI[r.cuisineType] || '🍽️'}</span>}
                                        {!r.isOpen && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">Closed</span>
                                            </div>
                                        )}
                                        {/* Favorite Toggle Button */}
                                        <button
                                            onClick={(e) => toggleFavorite(e, r.id)}
                                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 transition-all hover:scale-110 z-10"
                                        >
                                            <span className={`text-lg transition-colors ${favorites.has(r.id) ? 'text-brand-500' : 'text-white drop-shadow-md'}`}>
                                                {favorites.has(r.id) ? '♥' : '♡'}
                                            </span>
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
