import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

export default function RestaurantProfile() {
    const { user, logout } = useAuthStore()
    const [profile, setProfile] = useState(null)
    const [form, setForm] = useState({ name: '', address: '', cuisineType: '', isOpen: true, costForTwo: '', deliveryTime: '', fssaiLicense: '', isVegOnly: false, imageUrl: '' })
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [uploadingImage, setUploadingImage] = useState(false)

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const formData = new FormData()
        formData.append('image', file)
        setUploadingImage(true)
        try {
            const { data } = await api.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setForm(f => ({ ...f, imageUrl: data.imageUrl }))
        } catch { alert('Image upload failed') }
        finally { setUploadingImage(false) }
    }

    useEffect(() => {
        api.get('/api/restaurants/me/profile')
            .then(r => {
                setProfile(r.data);
                setForm({
                    name: r.data.name || '',
                    address: r.data.address || '',
                    cuisineType: r.data.cuisineType || '',
                    isOpen: r.data.isOpen ?? true,
                    costForTwo: r.data.costForTwo || '',
                    deliveryTime: r.data.deliveryTime || '',
                    fssaiLicense: r.data.fssaiLicense || '',
                    isVegOnly: r.data.isVegOnly || false,
                    imageUrl: r.data.imageUrl || ''
                })
            })
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
                    {profile?.imageUrl ? (
                        <div className="w-24 h-24 rounded-2xl mx-auto overflow-hidden border border-brand-500/30">
                            <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-4xl mx-auto">
                            🍽️
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-bold">{profile?.name} {profile?.isVegOnly && <span className="text-green-500 text-sm" title="Veg Only">🌿 Veg Only</span>}</h2>
                        <p className="text-gray-400 text-sm mt-0.5">{profile?.address}</p>
                        {profile?.cuisineType && <p className="text-gray-500 text-sm">{profile.cuisineType} cuisine</p>}

                        <div className="flex flex-wrap justify-center gap-2 mt-3 text-xs text-gray-400">
                            {profile?.costForTwo && <span className="bg-white/5 px-2 py-1 rounded">₹{profile.costForTwo} for two</span>}
                            {profile?.deliveryTime && <span className="bg-white/5 px-2 py-1 rounded">⏱ {profile.deliveryTime} mins</span>}
                            {profile?.fssaiLicense && <span className="bg-white/5 px-2 py-1 rounded">FSSAI: {profile.fssaiLicense}</span>}
                        </div>
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
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Cover Image</label>
                                <div className="flex flex-col gap-2">
                                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage}
                                        className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-500/20 file:text-brand-400 hover:file:bg-brand-500/30" />
                                    {uploadingImage && <span className="text-xs text-brand-400 animate-pulse">Uploading...</span>}
                                    <input className="input" placeholder="Or paste image URL" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Cost for Two (₹)</label>
                                    <input type="number" className="input" placeholder="e.g. 500" value={form.costForTwo} onChange={e => setForm({ ...form, costForTwo: e.target.value ? Number(e.target.value) : '' })} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Delivery Time (mins)</label>
                                    <input type="number" className="input" placeholder="e.g. 30" value={form.deliveryTime} onChange={e => setForm({ ...form, deliveryTime: e.target.value ? Number(e.target.value) : '' })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">FSSAI License No.</label>
                                <input className="input" placeholder="14-digit FSSAI number" value={form.fssaiLicense} onChange={e => setForm({ ...form, fssaiLicense: e.target.value })} />
                            </div>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 accent-brand-500" checked={form.isOpen} onChange={e => setForm({ ...form, isOpen: e.target.checked })} />
                                    <span className="text-sm text-gray-300">Open for Orders</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 accent-green-500" checked={form.isVegOnly} onChange={e => setForm({ ...form, isVegOnly: e.target.checked })} />
                                    <span className="text-sm text-gray-300">Pure Veg Only 🌿</span>
                                </label>
                            </div>
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
