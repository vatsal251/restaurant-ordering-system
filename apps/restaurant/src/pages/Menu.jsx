import { useState, useEffect } from 'react'
import api from '../lib/api'

const CATEGORIES = ['Starters', 'Main Course', 'Breads', 'Rice', 'Desserts', 'Beverages', 'Sides']
const MOOD_OPTIONS = ['comforting', 'healthy', 'spicy', 'sweet', 'cheat', 'light']

const emptyForm = { name: '', description: '', price: '', category: '', isAvailable: true, isVeg: true, moodTags: [], imageUrl: '' }

export default function Menu() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [editId, setEditId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [filterCat, setFilterCat] = useState('All')
    const [uploadingImage, setUploadingImage] = useState(false)

    // Addons State
    const [showAddonsFor, setShowAddonsFor] = useState(null)
    const [addonForm, setAddonForm] = useState({ name: '', price: '' })
    const [savingAddon, setSavingAddon] = useState(false)

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

    const fetchMenu = async () => {
        try {
            const { data } = await api.get('/api/restaurants/me/menu')
            console.log('MENU RESPONSE:', data)
            setItems(data)
        } catch (err) { 
            console.error('FETCH ERROR:', err)
            setItems([]) 
        }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchMenu() }, [])

    const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true) }
    const openEdit = (item) => {
        setForm({
            name: item.name,
            description: item.description || '',
            price: String(item.price),
            category: item.category || '',
            isAvailable: item.isAvailable,
            isVeg: item.isVeg !== false,
            moodTags: item.moodTags || [],
            imageUrl: item.imageUrl || ''
        })
        setEditId(item.id)
        setShowForm(true)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                ...form,
                price: parseFloat(form.price),
                category: form.category === '' ? null : form.category
            }
            if (editId) {
                await api.put(`/api/restaurants/me/menu/${editId}`, payload)
            } else {
                await api.post('/api/restaurants/me/menu', payload)
            }
            setShowForm(false)
            fetchMenu()
        } catch (err) {
            console.error('Save error:', err)
            alert('Failed to save item. Check console for details.')
        }
        finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this menu item?')) return
        setDeletingId(id)
        try {
            await api.delete(`/api/restaurants/me/menu/${id}`)
            setItems(it => it.filter(i => i.id !== id))
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete')
            fetchMenu() // Refresh as it might have been soft-deleted
        }
        finally { setDeletingId(null) }
    }

    const toggleAvailable = async (item) => {
        try {
            await api.put(`/api/restaurants/me/menu/${item.id}`, { ...item, isAvailable: !item.isAvailable })
            setItems(it => it.map(i => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i))
        } catch { alert('Failed to update') }
    }

    const updateStock = async (itemId, change, setUnlimited = false) => {
        try {
            const { data } = await api.patch('/api/restaurants/me/inventory', {
                menuItemId: itemId,
                change,
                reason: 'Menu Page Manual Update',
                setUnlimited
            })
            setItems(it => it.map(i => i.id === itemId ? { ...i, stockCount: data.newStock } : i))
        } catch (err) { alert('Failed to change stock') }
    }

    const handleAddAddon = async (e, itemId) => {
        e.preventDefault()
        setSavingAddon(true)
        try {
            const { data } = await api.post('/api/restaurants/me/addons', {
                menuItemId: itemId,
                ...addonForm
            })
            setItems(it => it.map(i => i.id === itemId ? { ...i, addOns: [...(i.addOns || []), data] } : i))
            setAddonForm({ name: '', price: '' })
        } catch (err) { alert('Failed to add Add-on') }
        finally { setSavingAddon(false) }
    }

    const handleRemoveAddon = async (itemId, addonId) => {
        try {
            await api.delete(`/api/restaurants/me/addons/${addonId}`)
            setItems(it => it.map(i => i.id === itemId ? { 
                ...i, addOns: i.addOns.filter(a => a.id !== addonId) 
            } : i))
        } catch (err) { alert('Failed to remove Add-on') }
    }

    const categories = ['All', ...new Set(items.map(i => i.category).filter(Boolean))]
    const filtered = filterCat === 'All' ? items : items.filter(i => i.category === filterCat)

    return (
        <div className="min-h-screen pb-10">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0d0a12]/95 backdrop-blur border-b border-white/5 flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <a href="/" className="text-xl">←</a>
                    <h1 className="font-bold text-lg">Menu Management</h1>
                </div>
                <button id="add-item-btn" onClick={openAdd} className="btn-primary text-sm py-2 px-4">
                    + Add Item
                </button>
            </div>

            <div className="px-4 pt-4 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="card text-center p-3">
                        <p className="text-xl font-bold text-brand-500">{items.length}</p>
                        <p className="text-xs text-gray-400">Total Items</p>
                    </div>
                    <div className="card text-center p-3">
                        <p className="text-xl font-bold text-green-400">{items.filter(i => i.isAvailable).length}</p>
                        <p className="text-xs text-gray-400">Available</p>
                    </div>
                    <div className="card text-center p-3">
                        <p className="text-xl font-bold text-red-400">{items.filter(i => !i.isAvailable).length}</p>
                        <p className="text-xs text-gray-400">Unavailable</p>
                    </div>
                </div>

                {/* Category filter */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {categories.map(c => (
                        <button key={c} onClick={() => setFilterCat(c)}
                            className={`whitespace-nowrap px-3 py-1 rounded-full text-sm transition-all ${filterCat === c ? 'bg-brand-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                                }`}>{c}</button>
                    ))}
                </div>

                {/* Menu items */}
                {loading ? (
                    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-20" />)}</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <div className="text-4xl mb-3">📃</div>
                        <p>No menu items yet</p>
                        <button onClick={openAdd} className="text-brand-500 hover:underline text-sm mt-2">Add your first item</button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map(item => (
                            <div key={item.id} id={`menu-item-${item.id}`}
                                className={`card flex items-center gap-3 ${!item.isAvailable ? 'opacity-50' : ''}`}>
                                {item.imageUrl && (
                                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center justify-center w-4 h-4 border-2 rounded-sm shrink-0 mr-1 ${item.isVeg !== false ? 'border-green-500' : 'border-red-500'}`}>
                                            <span className={`w-2 h-2 rounded-full ${item.isVeg !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                                        </span>
                                        <p className="font-medium truncate">{item.name}</p>
                                        {item.category && (
                                            <span className="text-xs bg-brand-500/10 text-brand-500 px-2 py-0.5 rounded-full">{item.category}</span>
                                        )}
                                    </div>
                                    {item.description && <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>}
                                    <div className="flex items-center gap-4 mt-2">
                                        <p className="text-brand-500 font-semibold text-sm">₹{item.price}</p>
                                        <div className="flex items-center gap-2 bg-gray-900 px-2 py-0.5 rounded-full border border-gray-800">
                                            <span className="text-xs text-gray-400">Stock:</span>
                                            {item.stockCount === null ? (
                                                <span className="text-xs font-semibold text-green-400">Unlimited</span>
                                            ) : (
                                                <div className="flex items-center gap-1.5">
                                                    <button onClick={() => updateStock(item.id, -1)} className="text-gray-400 hover:text-white px-1">-</button>
                                                    <span className={`text-xs font-bold ${item.stockCount <= 5 ? 'text-red-400' : 'text-gray-200'}`}>{item.stockCount}</span>
                                                    <button onClick={() => updateStock(item.id, +1)} className="text-gray-400 hover:text-white px-1">+</button>
                                                </div>
                                            )}
                                            <button 
                                                onClick={() => updateStock(item.id, 0, item.stockCount !== null)} 
                                                className="text-[10px] text-brand-500 hover:underline ml-1"
                                            >
                                                {item.stockCount === null ? 'Limit' : 'Set Unlimited'}
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => setShowAddonsFor(showAddonsFor === item.id ? null : item.id)}
                                            className="text-xs text-gray-400 hover:text-white underline ml-2"
                                        >
                                            {item.addOns?.length || 0} Add-ons
                                        </button>
                                    </div>

                                    {/* Inline Add-ons Manager */}
                                    {showAddonsFor === item.id && (
                                        <div className="mt-3 bg-white/5 rounded-lg p-3 border border-white/10">
                                            <h4 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Manage Add-ons</h4>
                                            {item.addOns?.length > 0 && (
                                                <div className="mb-3 space-y-1">
                                                    {item.addOns.map(addon => (
                                                        <div key={addon.id} className="flex items-center justify-between text-sm bg-black/20 px-2 py-1.5 rounded">
                                                            <span className="text-gray-300">{addon.name} <span className="text-brand-400 text-xs ml-1">+₹{addon.price}</span></span>
                                                            <button 
                                                                onClick={() => handleRemoveAddon(item.id, addon.id)}
                                                                className="text-red-400/70 hover:text-red-400 px-2 text-xs"
                                                            >×</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <form onSubmit={(e) => handleAddAddon(e, item.id)} className="flex items-center gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Add-on name (e.g. Extra Cheese)" 
                                                    className="input py-1.5 text-xs flex-1"
                                                    value={addonForm.name}
                                                    onChange={e => setAddonForm({...addonForm, name: e.target.value})}
                                                    required 
                                                />
                                                <input 
                                                    type="number" 
                                                    placeholder="₹ Price" 
                                                    className="input py-1.5 text-xs w-20"
                                                    value={addonForm.price}
                                                    onChange={e => setAddonForm({...addonForm, price: e.target.value})}
                                                    required 
                                                    min="0"
                                                />
                                                <button 
                                                    type="submit" 
                                                    disabled={savingAddon}
                                                    className="btn-primary py-1.5 px-3 text-xs shrink-0"
                                                >
                                                    {savingAddon ? '...' : 'Add'}
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Available toggle */}
                                    <button
                                        id={`toggle-${item.id}`}
                                        onClick={() => toggleAvailable(item)}
                                        title={item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                                        className={`w-10 h-5 rounded-full transition-colors relative ${item.isAvailable ? 'bg-green-500' : 'bg-gray-600'}`}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.isAvailable ? 'left-5' : 'left-0.5'}`} />
                                    </button>
                                    <button id={`edit-${item.id}`} onClick={() => openEdit(item)} className="text-gray-400 hover:text-white text-sm px-2">✏️</button>
                                    <button
                                        id={`delete-${item.id}`}
                                        onClick={() => handleDelete(item.id)}
                                        disabled={deletingId === item.id}
                                        className="text-red-400 hover:text-red-300 text-sm px-2"
                                    >🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-[#1a1a2e] rounded-2xl w-full max-w-md p-5 space-y-4">
                        <h2 className="font-bold text-lg">{editId ? 'Edit Item' : 'Add Menu Item'}</h2>
                        <form onSubmit={handleSave} className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Item Name *</label>
                                <input className="input" placeholder="e.g. Butter Chicken" value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                                <input className="input" placeholder="Short description" value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Image</label>
                                <div className="flex flex-col gap-2">
                                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage}
                                        className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-500/20 file:text-brand-400 hover:file:bg-brand-500/30" />
                                    {uploadingImage && <span className="text-xs text-brand-400 animate-pulse">Uploading...</span>}
                                    <input className="input" placeholder="Or paste image URL" value={form.imageUrl}
                                        onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Price (₹) *</label>
                                    <input className="input" type="number" min="0" step="0.5" placeholder="0.00" value={form.price}
                                        onChange={e => setForm({ ...form, price: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Category</label>
                                    <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                        <option value="">None</option>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 accent-brand-500" checked={form.isAvailable}
                                        onChange={e => setForm({ ...form, isAvailable: e.target.checked })} />
                                    <span className="text-sm text-gray-300">Available</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 accent-green-500" checked={form.isVeg}
                                        onChange={e => setForm({ ...form, isVeg: e.target.checked })} />
                                    <span className="text-sm text-gray-300">Vegetarian</span>
                                </label>
                            </div>

                            {/* Mood Tags */}
                            <div className="pt-2 border-t border-white/10">
                                <label className="text-xs text-gray-400 mb-2 block">Mood Tags (for Surprise Meal)</label>
                                <div className="flex flex-wrap gap-2">
                                    {MOOD_OPTIONS.map(mood => (
                                        <button
                                            key={mood}
                                            type="button"
                                            onClick={() => {
                                                const tags = form.moodTags.includes(mood)
                                                    ? form.moodTags.filter(t => t !== mood)
                                                    : [...form.moodTags, mood]
                                                setForm({ ...form, moodTags: tags })
                                            }}
                                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors capitalize ${form.moodTags.includes(mood)
                                                ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            {mood === 'cheat' ? 'cheat meal' : mood}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
                                <button id="save-item-btn" type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                                    {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
