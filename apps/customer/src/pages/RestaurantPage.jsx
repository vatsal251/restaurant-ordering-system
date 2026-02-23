// Stub placeholder for Restaurant Page — shows menu items for a restaurant
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'

export default function RestaurantPage() {
    const { id } = useParams()
    const [restaurant, setRestaurant] = useState(null)
    const [menu, setMenu] = useState([])
    const [cart, setCart] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            api.get(`/api/restaurants/${id}`),
            api.get(`/api/restaurants/${id}/menu`)
        ]).then(([r, m]) => { setRestaurant(r.data); setMenu(m.data) })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [id])

    const addToCart = (item) => setCart(c => {
        const existing = c.find(i => i.id === item.id)
        if (existing) return c.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
        return [...c, { ...item, qty: 1 }]
    })

    if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading…</div>
    if (!restaurant) return <div className="flex items-center justify-center min-h-screen text-gray-400">Restaurant not found</div>

    return (
        <div className="min-h-screen pb-32">
            {/* Header */}
            <div className="relative w-full h-48 bg-gradient-to-br from-brand-500/30 to-transparent flex items-end px-4 pb-4">
                <Link to="/" className="absolute top-4 left-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white">←</Link>
                <div>
                    <h1 className="text-2xl font-bold">{restaurant.name}</h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-300">
                        <span>⭐ {restaurant.rating || '4.2'}</span>
                        <span>• {restaurant.cuisine_type}</span>
                        <span className={`badge ${restaurant.is_open ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {restaurant.is_open ? 'Open' : 'Closed'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Menu */}
            <div className="px-4 pt-4 space-y-3">
                <h2 className="font-semibold text-lg">Menu</h2>
                {menu.length === 0 && <p className="text-gray-500 text-sm">No menu items available</p>}
                {menu.map(item => (
                    <div key={item.id} className="card flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-gray-400 text-sm">{item.description}</p>
                            <p className="text-brand-500 font-semibold mt-1">₹{item.price}</p>
                        </div>
                        <button id={`add-${item.id}`} onClick={() => addToCart(item)}
                            className="btn-primary whitespace-nowrap text-sm px-4 py-2">
                            + Add
                        </button>
                    </div>
                ))}
            </div>

            {/* Floating cart */}
            {cart.length > 0 && (
                <Link to="/cart" className="fixed bottom-6 left-4 right-4 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-4 rounded-2xl flex items-center justify-between shadow-lg shadow-brand-500/30 transition-colors">
                    <span>{cart.reduce((s, i) => s + i.qty, 0)} items</span>
                    <span>View Cart →</span>
                </Link>
            )}
        </div>
    )
}
