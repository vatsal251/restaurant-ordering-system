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
        <div className="min-h-screen bg-white pb-32 font-sans">
            {/* Top Navigation */}
            <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm px-4 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to="/" className="text-gray-600 font-bold hover:text-gray-900 transition-colors text-lg">← Back</Link>
                    <div className="flex gap-4">
                        <Link to="/search" className="text-gray-600 hover:text-gray-900 bg-gray-50/80 border border-gray-200/80 hover:bg-white hover:shadow-sm transition-all px-4 py-1.5 rounded-lg text-sm flex items-center gap-2">🔍 Search</Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-6">
                {/* Image Banner Grid */}
                <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[60vh] rounded-2xl overflow-hidden mb-8">
                    <div className="col-span-2 row-span-2 bg-gray-100">
                        {restaurant.imageUrl ? <img src={restaurant.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-6xl">🍽️</div>}
                    </div>
                    {/* Mock sub-images */}
                    <div className="bg-gray-200"><img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c" className="w-full h-full object-cover" /></div>
                    <div className="bg-gray-200"><img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1" className="w-full h-full object-cover" /></div>
                    <div className="bg-gray-200"><img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38" className="w-full h-full object-cover" /></div>
                    <div className="bg-gray-200 relative">
                        <img src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-medium hover:bg-black/50 cursor-pointer">+12 Photos</div>
                    </div>
                </div>

                {/* Header Section */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2">{restaurant.name}</h1>
                        <p className="text-gray-600 text-lg mb-1">{restaurant.cuisineType}</p>
                        <p className="text-gray-500 text-sm">{restaurant.address || 'Hogwarts, London'} • <span className={restaurant.isOpen ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>{restaurant.isOpen ? 'Open Now' : 'Closed'}</span></p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex flex-col items-center justify-center border border-gray-200 rounded-xl p-2 shadow-sm">
                            <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-lg font-bold text-lg">
                                {restaurant.rating || '4.2'} ⭐
                            </div>
                            <div className="text-[11px] text-gray-400 font-medium mt-1 border-t border-gray-100 pt-1 w-full text-center">
                                {restaurant.reviews?.length || '120'} Reviews
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-8">
                    <button className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors">
                        🧭 Direction
                    </button>
                    <button onClick={toggleFav} className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors">
                        <span className={isFav ? 'text-brand-500' : 'text-gray-400'}>{isFav ? '♥' : '♡'}</span> Bookmark
                    </button>
                    <button className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors">
                        🔗 Share
                    </button>
                </div>

                {/* Sticky Horizontal Tabs */}
                <div className="sticky top-[52px] z-30 bg-white border-b border-gray-200 mb-8 pt-2">
                    <div className="flex gap-8 overflow-x-auto scrollbar-hide">
                        {['Overview', 'Order Online', 'Reviews', 'Photos', 'Menu'].map(tab => (
                            <button key={tab} className={`pb-3 text-lg font-medium whitespace-nowrap transition-colors ${tab === 'Order Online' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-brand-600'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3-Column Layout for "Order Online" */}
                <div className="flex flex-col lg:flex-row gap-8 relative">

                    {/* Left Column: Categories */}
                    <div className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-[140px]">
                            <h3 className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-4">Categories</h3>
                            <div className="flex flex-col border-r border-gray-100 pr-4">
                                {categories.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setFilterCat(c)}
                                        className={`text-left py-3 text-base font-medium border-r-2 -mr-[2px] pr-4 transition-colors ${filterCat === c ? 'text-brand-600 border-brand-600 bg-brand-50/50' : 'text-gray-600 border-transparent hover:text-brand-600'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Middle Column: Menu Items */}
                    <div className="flex-1 min-w-0">
                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
                            <div className="relative w-full sm:w-72">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                                <input
                                    type="search"
                                    placeholder="Search dish..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 shadow-sm"
                                />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-sm hover:bg-gray-50 z-20">
                                    <input type="radio" name="veg" checked={vegFilter === 'all'} onChange={() => setVegFilter('all')} className="text-brand-600 focus:ring-brand-500" />
                                    <span className="text-gray-700 font-medium">All</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer bg-white border border-green-200 rounded-lg px-3 py-2 text-sm shadow-sm hover:bg-green-50 z-20">
                                    <input type="radio" name="veg" checked={vegFilter === 'veg'} onChange={() => setVegFilter('veg')} className="text-green-600 focus:ring-green-500" />
                                    <span className="text-green-700 font-medium flex items-center gap-1"><VEG_DOT isVeg={true} /> Veg</span>
                                </label>
                            </div>
                        </div>

                        {/* Menu List */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">{filterCat === 'All' ? 'Recommended' : filterCat}</h2>
                            {filtered.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">No items found.</div>
                            ) : (
                                filtered.map(item => (
                                    <div key={item.id} className={`flex gap-4 border-b border-gray-100 pb-6 ${item.isAvailable === false ? 'opacity-50 grayscale' : ''}`}>
                                        <div className="flex-1 pr-4">
                                            <div className="mb-1.5"><VEG_DOT isVeg={item.isVeg !== false} /></div>
                                            <h3 className="font-bold text-gray-900 text-lg mb-1">{item.name}</h3>
                                            <p className="font-medium text-gray-800 mb-2">₹{item.price}</p>
                                            {item.description && <p className="text-gray-500 text-sm leading-relaxed max-w-xl">{item.description}</p>}
                                        </div>
                                        <div className="w-36 h-36 shrink-0 relative">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-2xl shadow-sm border border-gray-100" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-3xl">🍲</div>
                                            )}

                                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] z-20">
                                                {getItemQty(item.id) > 0 ? (
                                                    <div className="flex items-center justify-between bg-white/95 backdrop-blur border-brand-500 border rounded-lg shadow-md text-brand-600 font-bold overflow-hidden">
                                                        <button onClick={() => updateQuantity(item.id, getItemQty(item.id) - 1)} className="px-3 py-2 hover:bg-brand-50 transition-colors flex-1 text-center">−</button>
                                                        <span className="text-sm px-1 font-bold">{getItemQty(item.id)}</span>
                                                        <button onClick={() => handleAddItem(item)} className="px-3 py-2 hover:bg-brand-50 transition-colors flex-1 text-center">+</button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => item.isAvailable !== false && handleAddItem(item)}
                                                        disabled={item.isAvailable === false}
                                                        className="w-full bg-white/95 backdrop-blur border text-green-600 border-gray-300 rounded-lg shadow-md font-extrabold px-4 py-2 hover:shadow-lg hover:bg-gray-50 transition-all uppercase text-sm tracking-wide disabled:opacity-50"
                                                    >
                                                        ADD <span className="absolute top-1 right-2 text-[10px] text-green-500">+</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Column: Cart Widget */}
                    <div className="hidden lg:block w-80 shrink-0">
                        <div className="sticky top-[140px] bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <h3 className="font-bold text-gray-900 text-lg mb-6">Your Cart {cartCount > 0 ? `(${cartCount})` : ''}</h3>
                            {cartCount > 0 ? (
                                <>
                                    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 mb-6 scrollbar-hide">
                                        {cartItems.map(item => (
                                            <div key={item.id} className="flex justify-between items-start text-sm group">
                                                <div className="flex-1 pr-4">
                                                    <div className="flex items-start gap-1.5 align-top">
                                                        <span className="mt-1"><VEG_DOT isVeg={item.isVeg !== false} /></span>
                                                        <span className="font-semibold text-gray-800 leading-tight">{item.name}</span>
                                                    </div>
                                                    <div className="font-medium text-gray-600 mt-1 pl-6">₹{item.price}</div>
                                                </div>
                                                <div className="flex items-center justify-between bg-white border border-green-600 rounded-md shadow-sm text-green-600 font-bold w-16 text-xs h-7 shrink-0">
                                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-1.5 h-full hover:bg-green-50 transition-colors">−</button>
                                                    <span>{item.quantity}</span>
                                                    <button onClick={() => handleAddItem(item)} className="px-1.5 h-full hover:bg-green-50 transition-colors">+</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-dashed border-gray-300 pt-4 mb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium text-gray-600">Subtotal</span>
                                            <span className="font-bold text-gray-900 text-lg">₹{totalPrice().toFixed(0)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">Extra charges may apply</p>
                                    </div>
                                    <button onClick={() => navigate(activeGroupId ? `/group-order/${activeGroupId}` : "/cart")} className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/30 transition-all active:scale-95 text-lg">
                                        Checkout ➔
                                    </button>
                                </>
                            ) : (
                                <div className="text-center text-gray-400 py-10">
                                    <div className="text-5xl mb-4 grayscale opacity-20">🛒</div>
                                    <p className="text-lg font-medium text-gray-500">Cart is empty</p>
                                    <p className="text-sm mt-2 px-4 max-w-[250px] mx-auto">Good food is always cooking! Go ahead, order some yummy items from the menu.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Mobile Bottom Cart Bar */}
            {cartCount > 0 && (
                <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
                    <button onClick={() => navigate(activeGroupId ? `/group-order/${activeGroupId}` : "/cart")} className="w-full bg-brand-500 text-white font-bold px-5 py-4 rounded-2xl flex items-center justify-between shadow-xl shadow-brand-500/30">
                        <span className="bg-white/20 px-2.5 py-1 rounded flex items-center gap-1 text-sm font-semibold">{cartCount} items | ₹{totalPrice().toFixed(0)}</span>
                        <span className="flex items-center gap-2 text-lg">View Cart <span className="text-xl">➔</span></span>
                    </button>
                </div>
            )}
        </div>
    )
}
