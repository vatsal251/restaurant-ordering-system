import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { setAuth } = useAuthStore()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true); setError('')
        try {
            const { data } = await api.post('/api/auth/login', { ...form, role: 'restaurant_owner' })
            setAuth(data.user, data.token)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials')
        } finally { setLoading(false) }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <span className="text-4xl">🍽️</span>
                        <h1 className="text-3xl font-extrabold text-brand-500">FoodRush</h1>
                    </div>
                    <p className="text-gray-400">Restaurant Management Portal</p>
                </div>
                <div className="card space-y-5">
                    {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
                            <input id="email" type="email" className="input" placeholder="owner@restaurant.com"
                                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
                            <input id="password" type="password" className="input" placeholder="••••••••"
                                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                        </div>
                        <button id="login-btn" type="submit" disabled={loading}
                            className="btn-primary w-full mt-2 disabled:opacity-50">
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                    <p className="text-center text-sm text-gray-400">
                        New restaurant?{' '}
                        <Link to="/register" className="text-brand-500 hover:underline font-medium">Register your restaurant</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
