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
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Top Bar (Sticky) */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 pt-3 pb-3 px-4 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight italic">Foodie<span className="text-brand-600">Premium</span></h1>
                            <div className="hidden md:block w-px h-8 bg-gray-200 mx-2"></div>
                            <div className="cursor-pointer group">
                                <div className="flex items-center gap-1.5 text-gray-800 font-bold group-hover:text-brand-600 transition-colors">
                                    <span className="text-xl text-brand-500">📍</span>
                                    <span className="text-lg">{locationName}</span>
                                    <span className="text-xs text-gray-400">▼</span>
                                </div>
                                <p className="text-gray-500 text-sm truncate w-48 mt-0.5">{subLocation}</p>
                            </div>
                        </div>
                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-gray-600 font-medium">Hello, {user.name.split(' ')[0]}</span>
                                <Link to="/profile" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl border border-gray-200 hover:border-brand-300 hover:shadow-sm transition-all text-gray-700">
                                    👤
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-semibold text-sm">Log in</Link>
                                <Link to="/register" className="bg-brand-600 text-white hover:bg-brand-700 px-5 py-2 text-sm rounded-lg shadow-sm font-bold transition-colors">Sign up</Link>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 items-center">
                        {/* Search bar */}
                        <Link to="/search" className="flex-1 relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                            <div className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-500 font-medium shadow-inner hover:bg-white hover:shadow-sm focus:ring-2 focus:ring-brand-500/50 transition-all">
                                Search for restaurant, cuisine or a dish
                            </div>
                        </Link>
                        {user && (
                            <div className="flex gap-2 shrink-0">
                                <Link to="/orders" className="bg-white text-gray-700 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold text-sm shadow-sm">
                                    🧾 <span className="hidden sm:inline">Orders</span>
                                </Link>
                                {activeGroupId ? (
                                    <Link to={`/group-order/${activeGroupId}`} className="bg-green-500 text-white rounded-xl px-4 py-3 flex items-center gap-2 hover:bg-green-400 transition-colors font-bold text-sm shadow-sm border border-green-400">
                                        <span className="animate-pulse">🟢</span> <span className="hidden sm:inline">Group</span>
                                    </Link>
                                ) : (
                                    <Link to="/cart" className="bg-white border border-gray-200 text-gray-700 rounded-xl px-4 py-3 flex items-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold text-sm shadow-sm">
                                        🛒 <span className="hidden sm:inline">Cart</span>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 mt-8 px-4">
                {/* Left Sidebar (Filters & Promos) */}
                <div className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
                    {/* Filters Section */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 text-lg">Filters</h3>

                        <div className="mb-5">
                            <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Sort By</h4>
                            <div className="flex flex-col gap-2">
                                {SORT_OPTIONS.map(opt => (
                                    <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                                        <input type="radio" name="sort" checked={sortBy === opt.id} onChange={() => setSortBy(opt.id)} className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500" />
                                        <span className={`text-sm ${sortBy === opt.id ? 'text-gray-900 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mb-5">
                            <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Cuisines</h4>
                            <div className="flex flex-col gap-2">
                                {cuisines.map(c => (
                                    <label key={c} className="flex items-center gap-3 cursor-pointer group">
                                        <input type="radio" name="cuisine" checked={cuisine === c} onChange={() => setCuisine(c)} className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500" />
                                        <span className="w-6 text-center">{CUISINE_EMOJI[c]}</span>
                                        <span className={`text-sm ${cuisine === c ? 'text-gray-900 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>{c}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Other Filters</h4>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={showOpen} onChange={() => setShowOpen(o => !o)} className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500" />
                                <span className={`text-sm ${showOpen ? 'text-gray-900 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>🟢 Open Now</span>
                            </label>
                        </div>
                    </div>

                    {/* Promos & Quick Links */}
                    <div className={`w-full overflow-hidden rounded-2xl bg-gradient-to-r ${offer.color} p-5 relative border border-gray-200 shadow-sm transition-all duration-500`}>
                        <div className="relative z-10">
                            <p className="text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Special Offer</p>
                            <h2 className="text-xl font-black text-gray-900 leading-tight pr-8">{offer.title}</h2>
                            <p className="text-sm font-medium text-gray-700 mt-1">{offer.sub}</p>
                            <button className="mt-4 bg-white text-black text-xs font-bold px-4 py-2 rounded-full shadow border border-gray-100 hover:bg-gray-50 transition-colors">ORDER NOW</button>
                        </div>
                        <div className="absolute top-4 right-4 text-4xl opacity-80">{offer.emoji}</div>
                    </div>

                    {/* AI Assistant Feature Link */}
                    <Link to="/ai-assistant" className="block bg-white rounded-2xl p-4 border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-purple-50/50 group-hover:bg-purple-50 transition-colors"></div>
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <h3 className="font-bold text-purple-900 text-sm flex items-center gap-1">Ask AI Dietitian ✨</h3>
                                <p className="text-xs text-purple-700 mt-0.5">Find healthy, budget meals</p>
                            </div>
                            <span className="text-2xl drop-shadow-sm">🤖</span>
                        </div>
                    </Link>

                    {/* Surprise Me Feature Link */}
                    <Link to="/surprise" className="block bg-white rounded-2xl p-4 border border-orange-200 hover:border-orange-300 hover:shadow-md transition-all shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-orange-50/50 group-hover:bg-orange-50 transition-colors"></div>
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <h3 className="font-bold text-orange-900 text-sm">Can't Decide? 🎲</h3>
                                <p className="text-xs text-orange-700 mt-0.5">Mood-based Surprise</p>
                            </div>
                            <span className="text-2xl drop-shadow-sm">🍲</span>
                        </div>
                    </Link>
                </div>

                {/* Right Content (Restaurant Grid) */}
                <div className="flex-1 pb-10">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">{mealRec.title}</h2>
                        <p className="text-base text-gray-500 mt-1">{mealRec.sub}</p>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse shadow-sm h-64">
                                    <div className="w-full h-36 rounded-xl bg-gray-200 mb-4" />
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl shadow-sm">
                            <div className="text-6xl mb-4 opacity-50">🍽️</div>
                            <p className="text-lg text-gray-600 font-medium">No restaurants found</p>
                            {showOpen && <button onClick={() => setShowOpen(false)} className="text-brand-600 font-medium hover:underline mt-2">Clear "Open Now" filter</button>}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map(r => (
                                <Link key={r.id} to={`/restaurant/${r.id}`} id={`restaurant-${r.id}`}>
                                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all duration-300 group cursor-pointer relative flex flex-col h-full shadow-sm">
                                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-5xl relative overflow-hidden">
                                            {r.imageUrl
                                                ? <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                : <span className="text-gray-300">{CUISINE_EMOJI[r.cuisineType] || '🍽️'}</span>}

                                            {/* Badges Over Image */}
                                            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                                                {r.isPromoted && <span className="bg-white/90 text-gray-900 text-[10px] uppercase px-2 py-0.5 rounded shadow-sm font-bold tracking-wide">Ad</span>}
                                                {r.rating > 4.5 && <span className="bg-brand-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-sm">Bestseller</span>}
                                            </div>

                                            {/* Bottom Left Badge - Live Order Count / Offers */}
                                            <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 align-start">
                                                {r.costForTwo < 400 && <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded shadow-md inline-block max-w-max">Flat ₹100 OFF</span>}
                                                {r.rating >= 4.0 && <span className="bg-white/95 backdrop-blur-sm text-gray-800 text-[10px] px-2 py-1 rounded-md font-medium flex items-center gap-1 shadow inline-block max-w-max">📈 50+ ordered recently</span>}
                                            </div>

                                            {!r.isOpen && (
                                                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-20">
                                                    <span className="text-gray-800 text-sm font-bold bg-white px-4 py-1.5 rounded-full shadow-md border border-gray-200 uppercase tracking-widest">Closed</span>
                                                </div>
                                            )}
                                            {/* Favorite Toggle Button */}
                                            <button
                                                onClick={(e) => toggleFavorite(e, r.id)}
                                                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md transition-all hover:scale-110 z-30 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-500"
                                            >
                                                <span className={`text-lg transition-colors ${favorites.has(r.id) ? 'text-brand-500' : ''}`}>
                                                    {favorites.has(r.id) ? '♥' : '♡'}
                                                </span>
                                            </button>
                                        </div>
                                        <div className="p-4 flex flex-col flex-grow">
                                            <div className="flex items-start justify-between">
                                                <div className="pr-2">
                                                    <h3 className="font-bold text-gray-900 text-lg leading-tight flex items-center gap-1.5 truncate">
                                                        {r.name}
                                                        {r.isVegOnly && <span className="shrink-0 w-3 h-3 border border-green-600 p-0.5 flex justify-center items-center rounded-sm"><span className="w-1.5 h-1.5 bg-green-600 rounded-full" title="Veg Only"></span></span>}
                                                    </h3>
                                                    <p className="text-gray-500 text-sm mt-1 truncate">{r.cuisineType}</p>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0">
                                                    <div className="flex items-center gap-1 bg-green-600 text-white text-sm px-1.5 py-0.5 rounded font-bold shadow-sm">
                                                        {r.rating || '4.2'} <span className="text-[10px]">⭐</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 border-t border-gray-100">
                                                <span className="flex items-center gap-1 font-medium">
                                                    ⏱️ {r.deliveryTime || 30} mins
                                                </span>
                                                <span className="text-gray-300">|</span>
                                                <span className="font-medium">
                                                    ₹{r.costForTwo || 500} for two
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
