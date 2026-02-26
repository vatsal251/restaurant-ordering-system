import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

export default function AdminDashboard() {
    const { logout } = useAuthStore()
    const [tab, setTab] = useState('overview')
    const [stats, setStats] = useState(null)
    const [users, setUsers] = useState([])
    const [orders, setOrders] = useState([])
    const [disputes, setDisputes] = useState([])
    const [sealAudits, setSealAudits] = useState([])
    const [restaurants, setRestaurants] = useState([])
    const [promos, setPromos] = useState([])
    const [loading, setLoading] = useState(true)

    // Promo form state
    const [promoCode, setPromoCode] = useState('')
    const [promoDiscount, setPromoDiscount] = useState('')
    const [promoType, setPromoType] = useState('percentage')
    const [promoValidDays, setPromoValidDays] = useState('7')
    const [promoMaxUses, setPromoMaxUses] = useState('')
    const [creatingPromo, setCreatingPromo] = useState(false)

    useEffect(() => {
        Promise.all([
            api.get('/api/admin/stats').catch(() => ({ data: null })),
            api.get('/api/admin/users').catch(() => ({ data: [] })),
            api.get('/api/admin/orders').catch(() => ({ data: [] })),
            api.get('/api/admin/disputes').catch(() => ({ data: [] })),
            api.get('/api/admin/seal-audits').catch(() => ({ data: [] })),
            api.get('/api/admin/restaurants').catch(() => ({ data: [] })),
            api.get('/api/admin/promos').catch(() => ({ data: [] })),
        ]).then(([s, u, o, d, sa, r, p]) => {
            setStats(s.data)
            setUsers(u.data)
            setOrders(o.data)
            setDisputes(d.data)
            setSealAudits(sa.data)
            setRestaurants(r.data)
            setPromos(p.data)
        }).finally(() => setLoading(false))
    }, [])

    const blockUser = async (userId, isBlocked) => {
        try {
            await api.patch(`/api/admin/users/${userId}`, { isBlocked: !isBlocked })
            setUsers(u => u.map(usr => usr.id === userId ? { ...usr, isBlocked: !isBlocked } : usr))
        } catch { alert('Action failed') }
    }

    const toggleRestaurantApproval = async (id, isApproved) => {
        try {
            await api.patch(`/api/admin/restaurants/${id}/approve`, { isApproved: !isApproved })
            setRestaurants(r => r.map(rest => rest.id === id ? { ...rest, isApproved: !isApproved } : rest))
        } catch { alert('Failed to update restaurant status') }
    }

    const resolveDispute = async (orderId, notes) => {
        try {
            await api.patch(`/api/admin/disputes/${orderId}/resolve`, { adminNotes: notes, resolvedByAdmin: true })
            setDisputes(d => d.filter(x => x.orderId !== orderId))
        } catch { alert('Failed to resolve') }
    }

    const handleCreatePromo = async (e) => {
        e.preventDefault()
        if (!promoCode.trim() || !promoDiscount) return alert('Code and discount are required')
        setCreatingPromo(true)
        try {
            const validTo = new Date()
            validTo.setDate(validTo.getDate() + parseInt(promoValidDays))

            const res = await api.post('/api/admin/promos', {
                code: promoCode,
                discount: promoDiscount,
                type: promoType,
                validTo: validTo.toISOString(),
                maxUses: promoMaxUses ? parseInt(promoMaxUses) : null,
            })
            setPromos([...promos, res.data])
            setPromoCode(''); setPromoDiscount(''); setPromoMaxUses('');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create promo code')
        } finally {
            setCreatingPromo(false)
        }
    }

    const handleDeletePromo = async (id) => {
        if (!confirm('Delete this global promo code?')) return
        try {
            await api.delete(`/api/admin/promos/${id}`)
            setPromos(p => p.filter(code => code.id !== id))
        } catch {
            alert('Failed to delete promo')
        }
    }

    const TABS = [
        { id: 'overview', label: '📊 Overview' },
        { id: 'promos', label: '🎟️ Global Promos' },
        { id: 'users', label: '👥 Users' },
        { id: 'restaurants', label: '🍽️ Restaurants' },
        { id: 'orders', label: '📋 Orders' },
        { id: 'seal', label: '🔒 Seal Audit' },
        { id: 'disputes', label: '⚖️ Disputes' },
    ]

    return (
        <div className="min-h-screen">
            {/* Top bar */}
            <div className="sticky top-0 z-10 bg-[#080c14]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🛠️</span>
                    <span className="font-bold text-brand-500">FoodRush Admin</span>
                </div>
                <button onClick={logout} className="text-gray-500 hover:text-white text-sm">Logout</button>
            </div>

            {/* Tab nav */}
            <div className="flex gap-1 px-4 pt-4 overflow-x-auto scrollbar-hide border-b border-white/5 pb-0">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-400 hover:text-white'
                            }`}>{t.label}</button>
                ))}
            </div>

            <div className="px-4 pt-5 pb-10">
                {loading ? (
                    <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map(i => <div key={i} className="card animate-pulse h-24" />)}</div>
                ) : (
                    <>
                        {/* ─── OVERVIEW ─── */}
                        {tab === 'overview' && (
                            <div className="space-y-5">
                                {/* Revenue bar chart — 7 days */}
                                <RevenueChart orders={orders} />

                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Total Orders', value: stats?.totalOrders ?? orders.length, color: 'text-brand-500', emoji: '📋' },
                                        { label: 'Revenue Today', value: `₹${stats?.revenueToday ?? 0}`, color: 'text-green-400', emoji: '💰' },
                                        { label: 'Active Users', value: stats?.activeUsers ?? users.filter(u => !u.isBlocked).length, color: 'text-blue-400', emoji: '👥' },
                                        { label: 'Open Disputes', value: stats?.openDisputes ?? disputes.length, color: 'text-red-400', emoji: '⚖️' },
                                        { label: 'Restaurants', value: users.filter(u => u.role === 'restaurant_owner').length, color: 'text-yellow-400', emoji: '🍽️' },
                                        { label: 'Delivery Partners', value: users.filter(u => u.role === 'delivery_partner').length, color: 'text-purple-400', emoji: '🚴' },
                                    ].map(s => (
                                        <div key={s.label} className="card p-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span>{s.emoji}</span>
                                                <p className="text-xs text-gray-400">{s.label}</p>
                                            </div>
                                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Recent orders snapshot */}
                                <div className="card space-y-3">
                                    <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">Recent Orders</h2>
                                    {orders.slice(0, 5).map(o => (
                                        <div key={o.id} className="flex justify-between text-sm">
                                            <span className="text-gray-300">#{o.id.slice(-6).toUpperCase()} {o.restaurant?.name}</span>
                                            <span className="text-brand-500">₹{o.totalAmount}</span>
                                        </div>
                                    ))}
                                    {orders.length === 0 && <p className="text-gray-500 text-sm">No orders yet</p>}
                                    <button onClick={() => setTab('orders')} className="text-xs text-brand-500 hover:underline">View all →</button>
                                </div>
                            </div>
                        )}


                        {/* ─── GLOBAL PROMOS ─── */}
                        {tab === 'promos' && (
                            <div className="space-y-6">
                                <form onSubmit={handleCreatePromo} className="card space-y-4 border border-brand-500/20 bg-brand-500/5">
                                    <h2 className="font-semibold flex items-center gap-2">🎟️ Create Global Promo Code</h2>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-400 uppercase tracking-wide">Code</label>
                                            <input className="input uppercase font-mono" placeholder="FOODRUSH" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} required />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-400 uppercase tracking-wide">Type</label>
                                            <select className="input" value={promoType} onChange={e => setPromoType(e.target.value)}>
                                                <option value="percentage">% Percentage</option>
                                                <option value="flat">₹ Flat Amount</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-400 uppercase tracking-wide">Discount</label>
                                            <input type="number" step="0.01" min="0" className="input" value={promoDiscount} onChange={e => setPromoDiscount(e.target.value)} required />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-400 uppercase tracking-wide">Valid Days</label>
                                            <input type="number" min="1" className="input" value={promoValidDays} onChange={e => setPromoValidDays(e.target.value)} required />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-400 uppercase tracking-wide">Max Uses</label>
                                            <input type="number" min="1" className="input" placeholder="∞" value={promoMaxUses} onChange={e => setPromoMaxUses(e.target.value)} />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={creatingPromo} className="btn-primary w-full py-2">
                                        {creatingPromo ? 'Creating...' : 'Create Promo Code'}
                                    </button>
                                </form>

                                <div className="space-y-3">
                                    <h2 className="font-semibold text-gray-400 uppercase tracking-wide text-sm">Active Promotions</h2>
                                    {promos.length === 0 ? (
                                        <p className="text-gray-500 text-center py-5">No global promos yet</p>
                                    ) : (
                                        promos.map(p => {
                                            const active = new Date(p.validTo) > new Date() && (!p.maxUses || p.usedCount < p.maxUses)
                                            return (
                                                <div key={p.id} className={`card flex items-center justify-between ${active ? 'border-l-4 border-l-brand-500' : 'opacity-60'}`}>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold text-lg font-mono tracking-wider text-white">{p.code}</h3>
                                                            {!active && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold uppercase">Inactive</span>}
                                                        </div>
                                                        <p className="text-brand-400 font-semibold text-sm">{p.type === 'percentage' ? `${p.discount}% OFF` : `₹${p.discount} OFF`}</p>
                                                        <p className="text-xs text-gray-500 mt-1">Used {p.usedCount} {p.maxUses ? `/ ${p.maxUses}` : 'times'} · Expires {new Date(p.validTo).toLocaleDateString()}</p>
                                                    </div>
                                                    <button onClick={() => handleDeletePromo(p.id)} className="text-gray-400 hover:text-red-400 px-3 py-2 bg-white/5 rounded-lg transition-colors">🗑️</button>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ─── USERS ─── */}
                        {tab === 'users' && (
                            <div className="space-y-3">
                                <h2 className="font-semibold">All Users ({users.length})</h2>
                                {users.map(u => (
                                    <div key={u.id} id={`user-${u.id}`} className="card flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center font-bold text-brand-500 flex-shrink-0">
                                            {u.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{u.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'customer' ? 'bg-orange-500/10 text-orange-400' :
                                                    u.role === 'delivery_partner' ? 'bg-green-500/10 text-green-400' :
                                                        'bg-purple-500/10 text-purple-400'
                                                    }`}>{u.role.replace('_', ' ')}</span>
                                                {u.isBlocked && <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">Blocked</span>}
                                            </div>
                                        </div>
                                        <button
                                            id={`block-${u.id}`}
                                            onClick={() => blockUser(u.id, u.isBlocked)}
                                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0 ${u.isBlocked
                                                ? 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                                                : 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                                }`}
                                        >{u.isBlocked ? 'Unblock' : 'Block'}</button>
                                    </div>
                                ))}
                                {users.length === 0 && <p className="text-gray-500 text-center py-10">No users yet</p>}
                            </div>
                        )}

                        {/* ─── RESTAURANTS ─── */}
                        {tab === 'restaurants' && (
                            <div className="space-y-3">
                                <h2 className="font-semibold">All Restaurants ({restaurants.length})</h2>
                                {restaurants.map(r => (
                                    <div key={r.id} className="card flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center font-bold text-orange-500 flex-shrink-0">
                                                {r.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{r.name}</p>
                                                <p className="text-xs text-gray-400 truncate">Owner: {r.owner?.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">{r.cuisineType || 'No cuisine'}</span>
                                                    {!r.isApproved && <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">Suspended</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleRestaurantApproval(r.id, r.isApproved)}
                                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0 ${r.isApproved
                                                ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                                : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                                                }`}
                                        >{r.isApproved ? 'Suspend' : 'Approve'}</button>
                                    </div>
                                ))}
                                {restaurants.length === 0 && <p className="text-gray-500 text-center py-10">No restaurants found</p>}
                            </div>
                        )}

                        {/* ─── ORDERS ─── */}
                        {tab === 'orders' && (
                            <div className="space-y-3">
                                <h2 className="font-semibold">All Orders ({orders.length})</h2>
                                {orders.map(o => (
                                    <div key={o.id} className="card space-y-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-sm">#{o.id.slice(-8).toUpperCase()}</p>
                                                <p className="text-xs text-gray-400">{o.restaurant?.name} · {o.customer?.name}</p>
                                                <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString('en-IN')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-brand-500 font-semibold">₹{o.totalAmount}</p>
                                                <span className="text-xs text-gray-400">{o.status.replace(/_/g, ' ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {orders.length === 0 && <p className="text-gray-500 text-center py-10">No orders yet</p>}
                            </div>
                        )}

                        {/* ─── SEAL AUDIT ─── */}
                        {tab === 'seal' && (
                            <div className="space-y-3">
                                <h2 className="font-semibold">Seal Verification Audit Log</h2>
                                <p className="text-xs text-gray-500">All seal verification records — dispatch photos, pickup photos, and customer verdicts</p>
                                {sealAudits.map(s => (
                                    <div key={s.id} className="card space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-sm">Order #{s.orderId.slice(-6).toUpperCase()}</p>
                                                <p className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleString('en-IN')}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full border ${s.customerVerdict === 'intact' ? 'bg-green-500/10 text-green-400 border-green-400/30' :
                                                s.customerVerdict === 'suspicious' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-400/30' :
                                                    s.customerVerdict === 'tampered' ? 'bg-red-500/10 text-red-400 border-red-400/30' :
                                                        'bg-white/5 text-gray-400 border-white/10'
                                                }`}>
                                                {s.customerVerdict ? `Verdict: ${s.customerVerdict}` : 'Pending'}
                                            </span>
                                        </div>

                                        {/* 3 photos side by side */}
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { label: '🏪 Dispatch', url: s.dispatchPhotoUrl },
                                                { label: '🚴 Pickup', url: s.pickupPhotoUrl },
                                                { label: '📦 Received', url: s.customerPhotoUrl },
                                            ].map(p => (
                                                <div key={p.label} className="space-y-1">
                                                    <p className="text-xs text-gray-500 text-center">{p.label}</p>
                                                    <div className="aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/5">
                                                        {p.url
                                                            ? <img src={p.url} alt={p.label} className="w-full h-full object-cover cursor-pointer" onClick={() => window.open(p.url)} />
                                                            : <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No photo</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {s.disputeRaised && !s.resolvedByAdmin && (
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
                                                ⚠️ Dispute raised — requires admin review
                                            </div>
                                        )}
                                        {s.resolvedByAdmin && (
                                            <p className="text-xs text-green-400">✅ Resolved by admin — {s.adminNotes}</p>
                                        )}
                                    </div>
                                ))}
                                {sealAudits.length === 0 && (
                                    <div className="text-center py-10 text-gray-500">
                                        <div className="text-4xl mb-2">🔒</div>
                                        <p>No seal verification records yet</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── DISPUTES ─── */}
                        {tab === 'disputes' && (
                            <div className="space-y-4">
                                <h2 className="font-semibold">Open Disputes ({disputes.length})</h2>
                                {disputes.length === 0 ? (
                                    <div className="text-center py-16 text-gray-500">
                                        <div className="text-4xl mb-2">⚖️</div>
                                        <p>No open disputes — great news!</p>
                                    </div>
                                ) : (
                                    disputes.map(d => (
                                        <DisputeCard key={d.orderId} dispute={d} onResolve={resolveDispute} />
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )
                }
            </div >
        </div >
    )
}

function RevenueChart({ orders }) {
    // Build last 7 days revenue
    const days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return {
            label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
            date: d.toDateString(),
        }
    })

    const chartData = days.map(day => {
        const revenue = orders
            .filter(o => new Date(o.createdAt).toDateString() === day.date)
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
        return { ...day, revenue }
    })

    const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)
    const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0)

    return (
        <div className="card space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-semibold">📈 Revenue (Last 7 Days)</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Total: <span className="text-green-400 font-semibold">₹{totalRevenue.toLocaleString('en-IN')}</span></p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">Peak</p>
                    <p className="text-brand-500 font-bold">₹{Math.max(...chartData.map(d => d.revenue)).toLocaleString('en-IN')}</p>
                </div>
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-1.5 h-28">
                {chartData.map((day, i) => {
                    const heightPct = (day.revenue / maxRevenue) * 100
                    const isToday = i === 6
                    return (
                        <div key={day.label} className="flex-1 flex flex-col items-center gap-1 group relative">
                            {/* Tooltip */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                ₹{day.revenue.toLocaleString('en-IN')}
                            </div>
                            <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                                <div
                                    className={`w-full rounded-t-lg transition-all duration-700 ${isToday ? 'bg-brand-500' : 'bg-white/10 group-hover:bg-white/20'
                                        }`}
                                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                                />
                            </div>
                            <p className={`text-xs ${isToday ? 'text-brand-500 font-semibold' : 'text-gray-500'}`}>
                                {day.label}
                            </p>
                        </div>
                    )
                })}
            </div>

            {orders.length === 0 && (
                <p className="text-center text-xs text-gray-600">Place some orders to see revenue data</p>
            )}
        </div>
    )
}

function DisputeCard({ dispute, onResolve }) {

    const [notes, setNotes] = useState('')
    const [resolving, setResolving] = useState(false)

    const handle = async () => {
        if (!notes.trim()) { alert('Please enter resolution notes'); return }
        setResolving(true)
        await onResolve(dispute.orderId, notes)
        setResolving(false)
    }

    return (
        <div className="card space-y-3 border border-red-500/20">
            <div className="flex justify-between">
                <div>
                    <p className="font-semibold">Order #{dispute.orderId?.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-gray-500">{new Date(dispute.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${dispute.customerVerdict === 'tampered'
                    ? 'bg-red-500/10 text-red-400 border-red-400/30'
                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-400/30'
                    }`}>
                    {dispute.customerVerdict}
                </span>
            </div>

            {/* Comparison photos */}
            <div className="grid grid-cols-2 gap-2">
                {[
                    { label: '🏪 Dispatch Photo', url: dispute.dispatchPhotoUrl },
                    { label: '📦 Received Photo', url: dispute.customerPhotoUrl },
                ].map(p => (
                    <div key={p.label}>
                        <p className="text-xs text-gray-500 mb-1">{p.label}</p>
                        <div className="aspect-square rounded-lg overflow-hidden bg-white/5">
                            {p.url
                                ? <img src={p.url} alt={p.label} className="w-full h-full object-cover cursor-pointer" onClick={() => window.open(p.url)} />
                                : <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No photo</div>}
                        </div>
                    </div>
                ))}
            </div>

            <textarea
                className="input resize-none h-16 text-sm"
                placeholder="Resolution notes (e.g. Refund initiated / No evidence of tampering)…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
            />
            <button
                id={`resolve-${dispute.orderId}`}
                onClick={handle}
                disabled={resolving}
                className="btn-primary w-full text-sm py-2.5 disabled:opacity-50"
            >
                {resolving ? 'Resolving…' : '✅ Mark Resolved'}
            </button>
        </div>
    )
}
