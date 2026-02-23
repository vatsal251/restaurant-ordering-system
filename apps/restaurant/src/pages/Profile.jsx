import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

export default function RestaurantProfile() {
    const { user, logout } = useAuthStore()
    const [profile, setProfile] = useState(null)
    const [form, setForm] = useState({ name: '', address: '', cuisineType: '', isOpen: true })
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/api/restaurants/me/profile')
            .then(r => { setProfile(r.data); setForm({ name: r.data.name, address: r.data.address, cuisineType: r.data.cuisineType || '', isOpen: r.data.isOpen }) })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const { data } = await api.patch('/api/restaurants/me/profile', form)
            setProfile(data)
            setEditing(false)
        } catch { alert('Failed to save') }
        finally { setSaving(false) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading…</div>

    return (
        <div className="min-h-screen pb-10">
            <div className="sticky top-0 z-10 bg-[#0d0a12]/95 backdrop-blur border-b border-white/5 flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <Link to="/" className="text-xl">←</Link>
                    <h1 className="font-bold">Restaurant Profile</h1>
                </div>
                {!editing && (
                    <button onClick={() => setEditing(true)} className="text-sm text-brand-500 hover:underline">Edit</button>
                )}
            </div>

            <div className="px-4 pt-6 space-y-5">
                {/* Restaurant identity */}
                <div className="card text-center py-8 space-y-3">
                    <div className="w-20 h-20 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-4xl mx-auto">
                        🍽️
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{profile?.name}</h2>
                        <p className="text-gray-400 text-sm mt-0.5">{profile?.address}</p>
                        {profile?.cuisineType && <p className="text-gray-500 text-sm">{profile.cuisineType} cuisine</p>}
                    </div>
                    <span className={`inline-block text-xs px-3 py-1 rounded-full border ${profile?.isOpen ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {profile?.isOpen ? '● Open' : '● Closed'}
                    </span>
                </div>

                {/* Owner info */}
                <div className="card space-y-3">
                    <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">Owner Details</h3>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Name</span>
                        <span>{user?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Email</span>
                        <span className="text-gray-300">{user?.email}</span>
                    </div>
                    {user?.phone && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Phone</span>
                            <span>{user.phone}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Rating</span>
                        <span className="text-yellow-400">⭐ {profile?.rating || '4.0'}</span>
                    </div>
                </div>

                {/* Edit form */}
                {editing && (
                    <div className="card space-y-4">
                        <h3 className="font-semibold">Edit Restaurant Info</h3>
                        <form onSubmit={handleSave} className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Restaurant Name</label>
                                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Address</label>
                                <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Cuisine Type</label>
                                <input className="input" placeholder="e.g. Indian, Chinese" value={form.cuisineType} onChange={e => setForm({ ...form, cuisineType: e.target.value })} />
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 accent-brand-500" checked={form.isOpen} onChange={e => setForm({ ...form, isOpen: e.target.checked })} />
                                <span className="text-sm text-gray-300">Restaurant is open</span>
                            </label>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setEditing(false)} className="btn-outline flex-1">Cancel</button>
                                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                                    {saving ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Logout */}
                <button onClick={logout} className="w-full py-3 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-medium">
                    Sign Out
                </button>
            </div>
        </div>
    )
}
