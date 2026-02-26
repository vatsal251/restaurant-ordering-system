import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'

export default function Addresses() {
    const [addresses, setAddresses] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [newAddress, setNewAddress] = useState({ type: 'home', street: '', city: '', state: '', zip: '' })
    const [saving, setSaving] = useState(false)

    const fetchAddresses = () => {
        setLoading(true)
        api.get('/api/addresses')
            .then(res => setAddresses(res.data))
            .catch(() => setAddresses([]))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchAddresses()
    }, [])

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await api.post('/api/addresses', newAddress)
            setShowAdd(false)
            setNewAddress({ type: 'home', street: '', city: '', state: '', zip: '' })
            fetchAddresses()
        } catch (err) {
            alert('Failed to save address')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this address?')) return
        try {
            await api.delete(`/api/addresses/${id}`)
            setAddresses(curr => curr.filter(a => a.id !== id))
        } catch {
            alert('Failed to delete address')
        }
    }

    return (
        <div className="min-h-screen pb-10">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/profile" className="text-xl">←</Link>
                    <h1 className="font-bold">My Addresses</h1>
                </div>
                <button onClick={() => setShowAdd(true)} className="text-brand-500 text-sm font-semibold">+ Add New</button>
            </div>

            <div className="px-4 pt-6 space-y-4">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => <div key={i} className="animate-pulse h-24 bg-white/5 rounded-2xl" />)}
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-3">📍</div>
                        <p>No saved addresses yet.</p>
                    </div>
                ) : (
                    addresses.map(a => (
                        <div key={a.id} className="card p-4 flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                                {a.type === 'home' ? '🏠' : a.type === 'work' ? '🏢' : '📍'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold capitalize text-white">{a.type}</h3>
                                    <button onClick={() => handleDelete(a.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed truncate">{a.street}, {a.city}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Address Sheet */}
            {showAdd && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-end animate-in fade-in duration-200" onClick={() => setShowAdd(false)}>
                    <div className="w-full bg-[#1a1a1a] rounded-t-3xl p-5 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-5" />
                        <h2 className="text-xl font-bold mb-5">Add New Address</h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="flex gap-2">
                                {['home', 'work', 'other'].map(t => (
                                    <button key={t} type="button" onClick={() => setNewAddress({ ...newAddress, type: t })}
                                        className={`flex-1 py-2 rounded-xl border text-sm capitalize font-medium transition-colors ${newAddress.type === t ? 'bg-brand-500/10 border-brand-500 text-brand-500' : 'bg-transparent border-white/10 text-gray-400'}`}>
                                        {t === 'home' ? '🏠 ' : t === 'work' ? '🏢 ' : '📍 '}{t}
                                    </button>
                                ))}
                            </div>

                            <input
                                required
                                type="text"
                                placeholder="Street Address / House No."
                                className="input"
                                value={newAddress.street}
                                onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    required
                                    type="text"
                                    placeholder="City"
                                    className="input"
                                    value={newAddress.city}
                                    onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="State (Optional)"
                                    className="input"
                                    value={newAddress.state}
                                    onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                                />
                            </div>

                            <button type="submit" disabled={saving} className="btn-primary w-full mt-2">
                                {saving ? 'Saving...' : 'Save Address'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
