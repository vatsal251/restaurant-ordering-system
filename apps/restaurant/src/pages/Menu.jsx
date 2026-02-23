import { useState, useEffect } from 'react'
import api from '../lib/api'

const CATEGORIES = ['Starters', 'Main Course', 'Breads', 'Rice', 'Desserts', 'Beverages', 'Sides']

const emptyForm = { name: '', description: '', price: '', category: '', isAvailable: true }

export default function Menu() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [editId, setEditId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [filterCat, setFilterCat] = useState('All')

    const fetchMenu = async () => {
        try {
            const { data } = await api.get('/api/restaurants/me/menu')
            setItems(data)
        } catch { setItems([]) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchMenu() }, [])

    const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true) }
    const openEdit = (item) => {
        setForm({ name: item.name, description: item.description || '', price: String(item.price), category: item.category || '', isAvailable: item.isAvailable })
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
        } catch { alert('Failed to delete') }
        finally { setDeletingId(null) }
    }

    const toggleAvailable = async (item) => {
        try {
            await api.put(`/api/restaurants/me/menu/${item.id}`, { ...item, isAvailable: !item.isAvailable })
            setItems(it => it.map(i => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i))
        } catch { alert('Failed to update') }
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
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium truncate">{item.name}</p>
                                        {item.category && (
                                            <span className="text-xs bg-brand-500/10 text-brand-500 px-2 py-0.5 rounded-full">{item.category}</span>
                                        )}
                                    </div>
                                    {item.description && <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>}
                                    <p className="text-brand-500 font-semibold text-sm mt-1">₹{item.price}</p>
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
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 accent-brand-500" checked={form.isAvailable}
                                    onChange={e => setForm({ ...form, isAvailable: e.target.checked })} />
                                <span className="text-sm text-gray-300">Available for ordering</span>
                            </label>
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
