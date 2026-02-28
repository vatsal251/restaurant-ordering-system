import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useGroupOrderStore } from '../store/groupOrderStore'
import { toast } from 'react-hot-toast'
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
    const getMealRecommendation = () => {
        const hour = new Date().getHours()
        if (hour >= 5 && hour < 11) return { title: 'Early Morning Breakfast 🌅', sub: 'Kickstart your day with these options' }
        if (hour >= 11 && hour < 16) return { title: 'Lunchtime Favorites 🍱', sub: 'Satisfy your midday cravings' }
        if (hour >= 16 && hour < 19) return { title: 'Evening Snacks ☕', sub: 'Perfect bites for your tea time' }
        if (hour >= 19 && hour < 23) return { title: 'Dinner Delights 🌙', sub: 'End your day with a hearty meal' }
        return { title: 'Midnight Cravings 🦉', sub: 'Late night? We got you covered' }
    }
    const mealRec = getMealRecommendation()
    const { user, logout } = useAuthStore()
    const { activeGroupId } = useGroupOrderStore()
    const [restaurants, setRestaurants] = useState([])
    const [search, setSearch] = useState('')
    const [cuisine, setCuisine] = useState('All')
    const [sortBy, setSortBy] = useState('relevance')
    const [showOpen, setShowOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [offerIdx, setOfferIdx] = useState(0)
    const [creatingGroup, setCreatingGroup] = useState(false)
    const navigate = useNavigate()

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

    const startGroupOrder = async () => {
        setCreatingGroup(true)
        try {
            const res = await api.post('/api/group-orders', {}) // No restaurantId needed
            console.log("Create Group Order Response:", res)
            console.log("Navigating to:", `/group-order/${res.data.id}`)
            toast.success('Group Order created! Share the link.')
            navigate(`/group-order/${res.data.id}`)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to start group order')
            setCreatingGroup(false)
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

                {/* AI Assistant Feature Link */}
                <Link to="/ai-assistant" className="block mt-3 bg-gradient-to-r from-purple-600 to-brand-500 rounded-xl p-4 text-white hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(168,85,247,0.3)] border border-white/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <h3 className="font-bold text-lg flex items-center gap-1">Ask AI Dietitian ✨</h3>
                            <p className="text-sm text-white/90 mt-0.5">Find high protein, low budget meals instantly</p>
                        </div>
                        <span className="text-3xl drop-shadow-md">🤖</span>
                    </div>
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
                    <div className="flex flex-col gap-3 mt-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Link to="/orders" className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                                <span>🧾</span>
                                <span className="font-semibold text-sm">My Orders</span>
                            </Link>
                            {activeGroupId ? (
                                <Link to={`/group-order/${activeGroupId}`} className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-green-500/20 transition-colors">
                                    <span className="animate-pulse">🟢</span>
                                    <span className="font-semibold text-sm">Group Cart</span>
                                </Link>
                            ) : (
                                <Link to="/cart" className="bg-brand-500/10 border border-brand-500/20 text-brand-500 rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-brand-500/20 transition-colors">
                                    <span>🛒</span>
                                    <span className="font-semibold text-sm">Cart</span>
                                </Link>
                            )}
                        </div>
                        {activeGroupId ? (
                            <Link to={`/group-order/${activeGroupId}`} className="w-full bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-blue-600/30 transition-colors">
                                👥 Return to Active Group Order
                            </Link>
                        ) : (
                            <button onClick={startGroupOrder} disabled={creatingGroup} className="w-full bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-blue-600/30 transition-colors">
                                {creatingGroup ? <span className="animate-spin">⏳</span> : '👥 Start a Global Group Order'}
                            </button>
                        )}
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
            <div className="px-4 pb-3 pt-2">
                <h2 className="text-xl font-bold flex items-center gap-2">{mealRec.title}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{mealRec.sub}</p>
            </div>
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

                                        {/* Badges Over Image */}
                                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                                            {r.isPromoted && <span className="bg-gray-900/80 text-white text-[10px] uppercase px-2 py-0.5 rounded backdrop-blur font-bold border border-white/10">Ad</span>}
                                            {r.rating > 4.5 && <span className="bg-pink-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-lg shadow-pink-500/20">Bestseller</span>}
                                        </div>

                                        {/* Bottom Left Badge - Live Order Count / Offers */}
                                        <div className="absolute bottom-2 left-2 z-10 flex gap-2">
                                            {r.costForTwo < 400 && <span className="bg-blue-600 border border-blue-400 text-white text-xs font-bold px-2 py-0.5 rounded shadow">Flat ₹100 OFF</span>}
                                            {r.rating >= 4.0 && <span className="bg-brand-500/90 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">📈 50+ ordered recently</span>}
                                        </div>

                                        {!r.isOpen && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                                                <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">Closed</span>
                                            </div>
                                        )}
                                        {/* Favorite Toggle Button */}
                                        <button
                                            onClick={(e) => toggleFavorite(e, r.id)}
                                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 transition-all hover:scale-110 z-30"
                                        >
                                            <span className={`text-lg transition-colors ${favorites.has(r.id) ? 'text-brand-500' : 'text-white drop-shadow-md'}`}>
                                                {favorites.has(r.id) ? '♥' : '♡'}
                                            </span>
                                        </button>
                                    </div>
                                    <div className="p-4 relative">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-white text-lg leading-tight flex items-center gap-1">
                                                    {r.name}
                                                    {r.isVegOnly && <span className="shrink-0 w-3 h-3 border border-green-600 p-0.5 flex justify-center items-center rounded-sm"><span className="w-1.5 h-1.5 bg-green-600 rounded-full" title="Veg Only"></span></span>}
                                                </h3>
                                                <p className="text-gray-400 text-sm mt-0.5">{r.cuisineType}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-1 bg-green-800 text-white text-sm px-2 py-0.5 rounded-md font-bold shrink-0 shadow">
                                                    {r.rating || '4.2'} <span className="text-[10px]">⭐</span>
                                                </div>
                                                <div className="text-[10px] text-gray-500">{((r.rating || 4.2) * 120).toFixed(0)} ratings</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                                            <span className="bg-white/5 border border-white/10 text-gray-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                                ⏱️ {r.deliveryTime || 30} mins
                                            </span>
                                            <span className="text-gray-500 text-xs text-brand-400 border border-brand-500/30 bg-brand-500/10 px-2 py-0.5 rounded-full font-medium shadow-sm">
                                                {r.costForTwo > 600 ? 'Free Delivery' : '₹40 Delivery'}
                                            </span>
                                            <span className="text-gray-500 text-xs px-2">·</span>
                                            <span className="text-gray-400 text-xs font-medium">₹{r.costForTwo || 500} for two</span>
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
