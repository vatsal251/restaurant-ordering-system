import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { setAuth } = useAuthStore()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match')
            return
        }
        setLoading(true); setError('')
        try {
            const { data } = await api.post('/api/auth/register', {
                name: form.name,
                email: form.email,
                phone: form.phone,
                password: form.password,
                role: 'delivery_partner',
            })
            setAuth(data.user, data.token)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed')
        } finally { setLoading(false) }
    }

    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-3">
                        <span className="text-4xl">🚴</span>
                        <h1 className="text-3xl font-extrabold text-brand-500">FoodRush</h1>
                    </div>
                    <p className="text-gray-400">Join as a Delivery Partner and start earning</p>
                </div>

                {/* Form */}
                <div className="card space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-1.5 block">Full Name</label>
                            <input id="name" type="text" className="input" placeholder="Your Name"
                                value={form.name} onChange={update('name')} required />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1.5 block">Email Address</label>
                            <input id="email" type="email" className="input" placeholder="you@example.com"
                                value={form.email} onChange={update('email')} required />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1.5 block">Phone Number</label>
                            <input id="phone" type="tel" className="input" placeholder="+91 XXXXX XXXXX"
                                value={form.phone} onChange={update('phone')} required />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
                            <input id="password" type="password" className="input" placeholder="Min. 8 characters"
                                value={form.password} onChange={update('password')} required minLength={8} />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1.5 block">Confirm Password</label>
                            <input id="confirm-password" type="password" className="input" placeholder="Re-enter password"
                                value={form.confirmPassword} onChange={update('confirmPassword')} required minLength={8} />
                        </div>
                        <p className="text-xs text-gray-500 bg-white/5 rounded-xl p-3">
                            ℹ️ Your account will be reviewed and approved by the admin before you can accept orders.
                        </p>
                        <button id="register-btn" type="submit" disabled={loading}
                            className="btn-primary w-full disabled:opacity-50">
                            {loading ? 'Creating account…' : '🚴 Register as Delivery Partner'}
                        </button>
                    </form>
                    <p className="text-center text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-brand-500 hover:underline font-medium">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
