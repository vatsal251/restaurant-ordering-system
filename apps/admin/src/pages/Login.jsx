import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

// Admin credentials are set in the backend .env file:
// ADMIN_ID=foodrush_admin
// ADMIN_SECRET=<your_secure_password>
// These are NOT stored in the database — there is no "create account" for admin.

export default function Login() {
    const [form, setForm] = useState({ adminId: '', secretKey: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showHint, setShowHint] = useState(false)
    const { setAuth } = useAuthStore()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true); setError('')
        try {
            const { data } = await api.post('/api/auth/admin-login', {
                adminId: form.adminId,
                secretKey: form.secretKey,
            })
            setAuth(data.user, data.token)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid Admin ID or Secret Key')
        } finally { setLoading(false) }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <span className="text-4xl">🛠️</span>
                        <h1 className="text-3xl font-extrabold text-brand-500">FoodRush</h1>
                    </div>
                    <p className="text-gray-400 text-sm">Management Dashboard</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-1 rounded-full">
                        🔐 Restricted Access — Authorised Personnel Only
                    </div>
                </div>

                {/* Login Card */}
                <div className="card space-y-5">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                            ❌ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-1.5 block">Admin ID</label>
                            <input
                                id="admin-id"
                                type="text"
                                className="input font-mono tracking-wider"
                                placeholder="Enter your Admin ID"
                                value={form.adminId}
                                onChange={e => setForm({ ...form, adminId: e.target.value })}
                                autoComplete="off"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1.5 block">Secret Key</label>
                            <input
                                id="secret-key"
                                type="password"
                                className="input font-mono"
                                placeholder="Enter your Secret Key"
                                value={form.secretKey}
                                onChange={e => setForm({ ...form, secretKey: e.target.value })}
                                required
                            />
                        </div>

                        <button
                            id="login-btn"
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full disabled:opacity-50"
                        >
                            {loading ? 'Authenticating…' : '🔓 Access Dashboard'}
                        </button>
                    </form>

                    {/* Credentials hint (collapsible) */}
                    <div className="border-t border-white/5 pt-4">
                        <button
                            id="show-hint-btn"
                            onClick={() => setShowHint(h => !h)}
                            className="text-xs text-gray-500 hover:text-gray-400 flex items-center gap-1 mx-auto"
                        >
                            <span>{showHint ? '▲' : '▼'}</span>
                            {showHint ? 'Hide' : 'Where do I find my credentials?'}
                        </button>

                        {showHint && (
                            <div className="mt-3 bg-[#1a2030] border border-brand-500/20 rounded-xl p-4 text-xs text-gray-400 space-y-2">
                                <p className="text-brand-500 font-semibold text-sm">Admin Credentials Location</p>
                                <p>Admin credentials are <strong className="text-white">not registered via this portal</strong>. They are pre-configured by the system administrator in the backend environment file.</p>
                                <div className="bg-black/30 rounded-lg p-3 font-mono text-gray-300 space-y-1">
                                    <p className="text-gray-500"># backend/.env</p>
                                    <p><span className="text-yellow-400">ADMIN_ID</span>=<span className="text-green-400">your_admin_id</span></p>
                                    <p><span className="text-yellow-400">ADMIN_SECRET</span>=<span className="text-green-400">your_secure_secret</span></p>
                                </div>
                                <p>Contact your system administrator if you do not have access.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* No register option — intentional */}
                <p className="text-center text-xs text-gray-600 mt-4">
                    Admin accounts cannot be self-registered. Access is granted by system configuration only.
                </p>
            </div>
        </div>
    )
}
