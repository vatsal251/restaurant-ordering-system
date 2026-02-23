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
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            api.get('/api/admin/stats').catch(() => ({ data: null })),
            api.get('/api/admin/users').catch(() => ({ data: [] })),
            api.get('/api/admin/orders').catch(() => ({ data: [] })),
            api.get('/api/admin/disputes').catch(() => ({ data: [] })),
            api.get('/api/admin/seal-audits').catch(() => ({ data: [] })),
        ]).then(([s, u, o, d, sa]) => {
            setStats(s.data)
            setUsers(u.data)
            setOrders(o.data)
            setDisputes(d.data)
            setSealAudits(sa.data)
        }).finally(() => setLoading(false))
    }, [])

    const blockUser = async (userId, isBlocked) => {
        try {
            await api.patch(`/api/admin/users/${userId}`, { isBlocked: !isBlocked })
            setUsers(u => u.map(usr => usr.id === userId ? { ...usr, isBlocked: !isBlocked } : usr))
        } catch { alert('Action failed') }
    }

    const resolveDispute = async (orderId, notes) => {
        try {
            await api.patch(`/api/admin/disputes/${orderId}/resolve`, { adminNotes: notes, resolvedByAdmin: true })
            setDisputes(d => d.filter(x => x.orderId !== orderId))
        } catch { alert('Failed to resolve') }
    }

    const TABS = [
        { id: 'overview', label: '📊 Overview' },
        { id: 'users', label: '👥 Users' },
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
                )}
            </div>
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
