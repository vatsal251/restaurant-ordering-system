import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function DeliveryProfile() {
    const { user, logout } = useAuthStore()

    return (
        <div className="min-h-screen pb-10">
            <div className="sticky top-0 z-10 bg-[#0a0f0a]/95 backdrop-blur border-b border-white/5 flex items-center gap-3 px-4 py-3">
                <Link to="/" className="text-xl">←</Link>
                <h1 className="font-bold">My Profile</h1>
            </div>

            <div className="px-4 pt-6 space-y-5">
                {/* Avatar */}
                <div className="card text-center py-8 space-y-3">
                    <div className="w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center text-3xl font-bold mx-auto">
                        {user?.name?.[0]?.toUpperCase() || 'D'}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{user?.name}</h2>
                        <p className="text-gray-400 text-sm">{user?.email}</p>
                        {user?.phone && <p className="text-gray-500 text-sm">{user?.phone}</p>}
                    </div>
                    <span className="inline-block bg-green-500/10 text-green-400 text-xs px-3 py-1 rounded-full border border-green-500/20">
                        🚴 Delivery Partner
                    </span>
                </div>

                {/* Quick links */}
                <div className="card space-y-0 divide-y divide-white/5">
                    <Link to="/earnings" className="flex items-center justify-between py-3.5 hover:text-brand-500 transition-colors">
                        <span className="flex items-center gap-3">
                            <span>💰</span>
                            <span>My Earnings</span>
                        </span>
                        <span className="text-gray-500">→</span>
                    </Link>
                </div>

                {/* Account info */}
                <div className="card space-y-3">
                    <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">Account</h3>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Role</span>
                        <span>Delivery Partner</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Member since</span>
                        <span className="text-gray-300">{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Logout */}
                <button onClick={logout} className="w-full py-3 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-medium">
                    Sign Out
                </button>
            </div>
        </div>
    )
}
