import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function Profile() {
    const { user, logout } = useAuthStore()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
    const [savingProfile, setSavingProfile] = useState(false)

    useEffect(() => {
        api.get('/api/orders')
            .then(r => setOrders(r.data))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false))
    }, [])

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setSavingProfile(true)
        try {
            const res = await api.put('/api/customer/profile', editForm)
            useAuthStore.setState({ user: res.data })
            toast.success("Profile updated successfully")
            setIsEditing(false)
        } catch (err) {
            toast.error("Failed to update profile")
        } finally {
            setSavingProfile(false)
        }
    }

    const totalSpent = orders
        .filter(o => o.status === 'delivered')
        .reduce((s, o) => s + o.totalAmount, 0)

    return (
        <div className="min-h-screen pb-10 bg-gray-50 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
                <Link to="/" className="text-xl text-gray-600 hover:text-gray-900 transition-colors">←</Link>
                <h1 className="font-bold text-gray-900 text-lg">My Profile</h1>
            </div>

            <div className="px-4 pt-6 space-y-6 max-w-2xl mx-auto">
                {/* Profile Cover & Info */}
                <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden relative">
                    {/* Cover Photo Area */}
                    <div className="h-32 bg-gradient-to-r from-brand-400 via-orange-400 to-red-400 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 [mask-image:linear-gradient(45deg,transparent,white)]"></div>
                        <button onClick={() => setIsEditing(true)} className="absolute top-4 right-4 bg-black/20 hover:bg-black/30 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm border border-white/20">
                            <span>✏️</span> Edit Profile
                        </button>
                    </div>

                    {/* Profile Details */}
                    <div className="px-6 pb-6 relative">
                        {/* Avatar */}
                        <div className="absolute -top-12 left-6 w-24 h-24 rounded-full bg-white flex items-center justify-center p-1 shadow-md">
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-100 to-orange-50 text-brand-600 flex items-center justify-center text-3xl font-black border border-brand-200">
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        </div>

                        <div className="ml-[104px] pt-3">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">{user?.name}</h2>
                            <p className="text-gray-500 font-medium text-sm mt-1 truncate">{user?.email}</p>

                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white font-bold text-[10px] px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span> Customer
                                </span>
                                <span className="text-gray-600 text-[11px] font-bold uppercase tracking-wider bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                                    {user?.phone || 'No Phone Added'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick actions grid (Unified) */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-2 flex justify-between items-center">
                    <Link to="/favourites" className="flex-1 flex flex-col items-center justify-center py-4 rounded-2xl hover:bg-red-50/50 transition-colors group">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-xl text-red-500 group-hover:scale-110 transition-transform shadow-sm">♥</div>
                        <p className="font-bold text-gray-700 mt-2 text-xs uppercase tracking-wide">Favourites</p>
                    </Link>
                    <div className="w-px h-12 bg-gray-100"></div>
                    <Link to="/addresses" className="flex-1 flex flex-col items-center justify-center py-4 rounded-2xl hover:bg-blue-50/50 transition-colors group">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-xl text-blue-500 group-hover:scale-110 transition-transform shadow-sm">📍</div>
                        <p className="font-bold text-gray-700 mt-2 text-xs uppercase tracking-wide">Addresses</p>
                    </Link>
                    <div className="w-px h-12 bg-gray-100"></div>
                    <Link to="/orders" className="flex-1 flex flex-col items-center justify-center py-4 rounded-2xl hover:bg-brand-50/50 transition-colors group">
                        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-xl text-green-500 group-hover:scale-110 transition-transform shadow-sm">📦</div>
                        <p className="font-bold text-gray-700 mt-2 text-xs uppercase tracking-wide">Orders</p>
                    </Link>
                </div>

                {/* Stats (Unified) */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] py-6 flex justify-between items-center divide-x divide-gray-100">
                    <div className="flex-1 text-center px-2">
                        <p className="text-2xl font-black text-gray-900">{orders.length}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Total Orders</p>
                    </div>
                    <div className="flex-1 text-center px-2">
                        <p className="text-2xl font-black text-green-600">{orders.filter(o => o.status === 'delivered').length}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Delivered</p>
                    </div>
                    <div className="flex-1 text-center px-2">
                        <p className="text-2xl font-black text-brand-600">₹{totalSpent.toFixed(0)}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Amount Spent</p>
                    </div>
                </div>

                {/* Recent orders */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                        <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                            <span>🧾</span> Recent Orders
                        </h3>
                        {orders.length > 5 && (
                            <Link to="/orders" className="text-brand-600 font-bold text-xs hover:underline uppercase tracking-wide bg-brand-50 px-3 py-1.5 rounded-full">
                                View All
                            </Link>
                        )}
                    </div>

                    {loading ? (
                        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="animate-pulse h-16 bg-gray-50 rounded-2xl" />)}</div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-3xl grayscale opacity-50 block mb-2">🍽️</span>
                            <p className="text-gray-500 text-sm font-medium">No orders yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.slice(0, 5).map(o => (
                                <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors rounded-2xl group border border-transparent hover:border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl shadow-sm border border-gray-200 overflow-hidden shrink-0">
                                            {o.restaurant?.imageUrl ? (
                                                <img src={o.restaurant.imageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : '🍔'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900 group-hover:text-brand-600 transition-colors">{o.restaurant?.name || 'Restaurant'}</p>
                                            <p className="font-bold text-xs text-gray-400 mt-0.5 uppercase tracking-wide">#{o.id.slice(-6)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-sm text-gray-900">₹{o.totalAmount}</p>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 px-2.5 py-1 rounded-md inline-block ${o.status === 'delivered' ? 'bg-green-50 text-green-600' : o.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-brand-50 text-brand-600 animate-pulse'}`}>
                                            {o.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Logout */}
                <div className="pt-2 pb-8">
                    <button
                        onClick={logout}
                        className="w-full py-4 text-[15px] font-bold rounded-2xl bg-white border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        <span>🚪</span> Sign Out
                    </button>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200" onClick={() => setIsEditing(false)}>
                    <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900">Edit Profile</h2>
                            <button onClick={() => setIsEditing(false)} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors">✕</button>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-gray-900 transition-all"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Phone Number</label>
                                <input
                                    type="tel"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-gray-900 transition-all"
                                    value={editForm.phone}
                                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                    placeholder="+91 XXXXXXXXXX"
                                />
                            </div>

                            <div className="pt-4">
                                <button type="submit" disabled={savingProfile} className="w-full py-4 text-white font-bold rounded-xl bg-gradient-to-r from-brand-500 to-orange-500 shadow-[0_4px_14px_0_rgb(249,115,22,0.39)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] hover:-translate-y-0.5 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none text-[15px]">
                                    {savingProfile ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
