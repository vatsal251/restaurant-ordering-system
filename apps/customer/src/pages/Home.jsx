import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

const cuisines = ['All', 'Pizza', 'Burger', 'Biryani', 'Chinese', 'South Indian', 'Desserts']

export default function Home() {
    const { user, logout } = useAuthStore()
    const [restaurants, setRestaurants] = useState([])
    const [search, setSearch] = useState('')
    const [cuisine, setCuisine] = useState('All')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/api/restaurants')
            .then(r => setRestaurants(r.data))
            .catch(() => setRestaurants([]))
            .finally(() => setLoading(false))
    }, [])

    const filtered = restaurants.filter(r =>
        (cuisine === 'All' || r.cuisineType === cuisine) &&
        r.name.toLowerCase().includes(search.toLowerCase())
    )

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

            {/* Hero */}
            <div className="px-4 pt-8 pb-4">
                <h1 className="text-2xl font-bold mb-1">Hey {user?.name?.split(' ')[0]} 👋</h1>
                <p className="text-gray-400 text-sm mb-5">What are you craving today?</p>
                <input
                    id="restaurant-search"
                    type="search"
                    className="input"
                    placeholder="🔍 Search restaurants or cuisines…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Cuisine filters */}
            <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
                {cuisines.map(c => (
                    <button
                        key={c}
                        id={`filter-${c.toLowerCase()}`}
                        onClick={() => setCuisine(c)}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${cuisine === c
                            ? 'bg-brand-500 text-white'
                            : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-white/10'
                            }`}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {/* Restaurant Grid */}
            <div className="px-4 pb-8">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
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
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {filtered.map(r => (
                            <Link key={r.id} to={`/restaurant/${r.id}`} id={`restaurant-${r.id}`}>
                                <div className="card hover:scale-[1.02] transition-transform cursor-pointer overflow-hidden p-0">
                                    <div className="w-full h-40 bg-gradient-to-br from-brand-500/20 to-brand-700/10 flex items-center justify-center text-5xl">
                                        {r.imageUrl
                                            ? <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                                            : '🍽️'}
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-white">{r.name}</h3>
                                                <p className="text-gray-400 text-sm">{r.cuisineType}</p>
                                            </div>
                                            <div className="flex items-center gap-1 bg-green-500/10 text-green-400 text-sm px-2 py-0.5 rounded-full">
                                                ⭐ {r.rating || '4.2'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`badge ${r.isOpen ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {r.isOpen ? '● Open' : '● Closed'}
                                            </span>
                                            <span className="text-gray-500 text-xs">25–35 min</span>
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
