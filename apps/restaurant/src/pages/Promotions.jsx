import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'

export default function Promotions() {
    const [promos, setPromos] = useState([])
    const [loading, setLoading] = useState(true)

    // New promo state
    const [code, setCode] = useState('')
    const [discount, setDiscount] = useState('')
    const [type, setType] = useState('percentage')
    const [validDays, setValidDays] = useState('7')
    const [maxUses, setMaxUses] = useState('')

    const [creating, setCreating] = useState(false)
    const [error, setError] = useState('')

    const fetchPromos = () => {
        api.get('/api/restaurants/me/promos')
            .then(r => setPromos(r.data))
            .catch(() => { })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchPromos()
    }, [])

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!code.trim() || !discount) return setError('Code and discount are required')

        setError('')
        setCreating(true)
        try {
            const validTo = new Date()
            validTo.setDate(validTo.getDate() + parseInt(validDays))

            await api.post('/api/restaurants/me/promos', {
                code,
                discount,
                type,
                validTo: validTo.toISOString(),
                maxUses: maxUses ? parseInt(maxUses) : null,
            })

            // Reset form
            setCode(''); setDiscount(''); setMaxUses('');
            fetchPromos()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create promo code')
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this promo code?')) return
        try {
            await api.delete(`/api/restaurants/me/promos/${id}`)
            setPromos(p => p.filter(code => code.id !== id))
        } catch {
            alert('Failed to delete')
        }
    }

    return (
        <div className="min-h-screen pb-10">
            <div className="sticky top-0 z-10 bg-[#0d0a12]/95 backdrop-blur border-b border-white/5 flex items-center gap-3 px-4 py-3">
                <Link to="/" className="text-xl">←</Link>
                <h1 className="font-bold text-lg">Promotions</h1>
            </div>

            <div className="px-4 pt-5 space-y-6">

                {/* Create Promo Form */}
                <form onSubmit={handleCreate} className="card space-y-4 border border-brand-500/20 bg-brand-500/5">
                    <h2 className="font-semibold flex items-center gap-2">🎟️ Create Promo Code</h2>

                    {error && <div className="text-red-400 text-sm bg-red-400/10 p-2 rounded">{error}</div>}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wide">Code</label>
                            <input
                                className="input uppercase font-mono"
                                placeholder="TRYNEW"
                                value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wide">Type</label>
                            <select className="input" value={type} onChange={e => setType(e.target.value)}>
                                <option value="percentage">% Percentage</option>
                                <option value="flat">₹ Flat Amount</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wide">Discount</label>
                            <input
                                type="number" step="0.01" min="0"
                                className="input" placeholder={type === 'percentage' ? '20' : '150'}
                                value={discount} onChange={e => setDiscount(e.target.value)} required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wide">Valid Days</label>
                            <input
                                type="number" min="1"
                                className="input"
                                value={validDays} onChange={e => setValidDays(e.target.value)} required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wide">Max Uses</label>
                            <input
                                type="number" min="1"
                                className="input" placeholder="∞"
                                value={maxUses} onChange={e => setMaxUses(e.target.value)}
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={creating} className="btn-primary w-full py-2">
                        {creating ? 'Creating...' : 'Create Promo Code'}
                    </button>
                </form>

                {/* Promo Code List */}
                <div className="space-y-3">
                    <h2 className="font-semibold text-gray-400 uppercase tracking-wide text-sm">Active Promotions</h2>

                    {loading ? (
                        <div className="animate-pulse space-y-3">
                            <div className="card h-20" />
                            <div className="card h-20" />
                        </div>
                    ) : promos.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <p className="text-4xl mb-2">🎟️</p>
                            <p>No active promotions.</p>
                        </div>
                    ) : (
                        promos.map(p => {
                            const isExpired = new Date(p.validTo) < new Date()
                            const isExhausted = p.maxUses && p.usedCount >= p.maxUses
                            const active = !isExpired && !isExhausted

                            return (
                                <div key={p.id} className={`card flex items-center justify-between transition-colors ${active ? 'border-l-4 border-l-brand-500' : 'opacity-60'}`}>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg font-mono text-white tracking-wider">{p.code}</h3>
                                            {!active && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase font-bold">Inactive</span>}
                                        </div>
                                        <p className="text-brand-400 font-semibold text-sm">
                                            {p.type === 'percentage' ? `${p.discount}% OFF` : `₹${p.discount} OFF`}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Used {p.usedCount} {p.maxUses ? `/ ${p.maxUses}` : 'times'} · Expires {new Date(p.validTo).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(p.id)}
                                        className="text-gray-500 hover:text-red-400 px-3 py-2 bg-white/5 rounded-lg transition-colors"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>

            </div>
        </div>
    )
}
