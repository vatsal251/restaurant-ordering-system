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
        <div className="min-h-screen pb-10 bg-gray-50 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <Link to="/profile" className="text-xl text-gray-600 hover:text-gray-900 transition-colors">←</Link>
                    <h1 className="font-bold text-gray-900 text-lg">My Addresses</h1>
                </div>
                <button onClick={() => setShowAdd(true)} className="bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200 transition-all font-bold text-sm px-4 py-1.5 rounded-lg shadow-sm">+ Add New</button>
            </div>

            <div className="px-4 pt-6 space-y-4">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => <div key={i} className="animate-pulse h-24 bg-white border border-gray-200 rounded-2xl shadow-sm" />)}
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl shadow-sm">
                        <div className="text-4xl mb-3 opacity-50">📍</div>
                        <p className="font-bold text-gray-900">No saved addresses yet.</p>
                        <p className="text-sm text-gray-500 mt-1">Add one to quickly check out later.</p>
                    </div>
                ) : (
                    addresses.map(a => (
                        <div key={a.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-3 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-100">
                                {a.type === 'home' ? '🏠' : a.type === 'work' ? '🏢' : '📍'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold capitalize text-gray-900">{a.type}</h3>
                                    <button onClick={() => handleDelete(a.id)} className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wide bg-red-50 px-2 py-1 rounded-md">Delete</button>
                                </div>
                                <p className="text-sm font-medium text-gray-500 leading-relaxed truncate">{a.street}, {a.city}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Address Sheet */}
            {showAdd && (
                <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-end animate-in fade-in duration-200" onClick={() => setShowAdd(false)}>
                    <div className="w-full bg-white rounded-t-3xl p-5 animate-in slide-in-from-bottom shadow-2xl border-t border-gray-200" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-5" />
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 mb-5">Add New Address</h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="flex gap-2">
                                {['home', 'work', 'other'].map(t => (
                                    <button key={t} type="button" onClick={() => setNewAddress({ ...newAddress, type: t })}
                                        className={`flex-1 py-2.5 rounded-xl border text-sm capitalize font-bold transition-all ${newAddress.type === t ? 'bg-brand-500 border-brand-500 text-white shadow-md' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                        {t === 'home' ? '🏠 ' : t === 'work' ? '🏢 ' : '📍 '}{t}
                                    </button>
                                ))}
                            </div>

                            <input
                                required
                                type="text"
                                placeholder="Street Address / House No."
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-gray-900 placeholder:text-gray-400 transition-all"
                                value={newAddress.street}
                                onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    required
                                    type="text"
                                    placeholder="City"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-gray-900 placeholder:text-gray-400 transition-all"
                                    value={newAddress.city}
                                    onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="State (Optional)"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-gray-900 placeholder:text-gray-400 transition-all"
                                    value={newAddress.state}
                                    onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                                />
                            </div>

                            <button type="submit" disabled={saving} className="w-full py-4 text-white font-bold rounded-xl bg-brand-500 shadow-[0_4px_14px_0_rgb(249,115,22,0.39)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] hover:bg-brand-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none mt-4 text-[15px]">
                                {saving ? '✨ Saving securely...' : 'Save Address'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
