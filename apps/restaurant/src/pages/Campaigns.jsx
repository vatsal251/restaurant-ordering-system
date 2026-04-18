import React, { useState, useEffect } from 'react'
import { Plus, Users, Send, Calendar, Activity, CheckCircle2 } from 'lucide-react'
import axios from 'axios'

const Campaigns = () => {
    const [campaigns, setCampaigns] = useState([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        targetAudience: 'all_past_customers'
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchCampaigns()
    }, [])

    const fetchCampaigns = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/restaurants/me/campaigns', { withCredentials: true })
            setCampaigns(res.data)
        } catch (error) {
            console.error('Failed to fetch campaigns', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await axios.post('http://localhost:3000/api/restaurants/me/campaigns', formData, { withCredentials: true })
            setFormData({ title: '', message: '', targetAudience: 'all_past_customers' })
            setIsCreating(false)
            fetchCampaigns()
        } catch (error) {
            console.error('Failed to create campaign', error)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading campaigns...</div>

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Push Campaigns</h1>
                    <p className="text-gray-500 mt-1">Send direct in-app notifications and offers to your past customers.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    New Campaign
                </button>
            </div>

            {/* Create Campaign Flow */}
            {isCreating && (
                <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
                    <div className="bg-indigo-50/50 p-6 border-b border-indigo-100">
                        <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                            <Send className="w-5 h-5 text-indigo-600" />
                            Draft New Campaign
                        </h2>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title (Internal)</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Summer Weekend Friyay"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                                    <select
                                        value={formData.targetAudience}
                                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="all_past_customers">All Past Customers</option>
                                        <option value="inactive_30_days">Inactive (No order in 30 days)</option>
                                        <option value="high_spenders">VIPs (High Spenders)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Push Notification Message</label>
                                <textarea
                                    required
                                    rows="4"
                                    placeholder="Enter the push notification text customers will see..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                />
                                <p className="text-xs text-gray-500 mt-2 text-right">
                                    {formData.message.length}/150 characters
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-6 py-2 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? 'Sending...' : 'Send Broadcast'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Campaign History */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.length === 0 && !isCreating ? (
                    <div className="col-span-full py-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
                        <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-gray-900 font-medium text-lg">No campaigns yet</h3>
                        <p className="text-gray-500 mt-1">Create your first push notification campaign to re-engage your customers.</p>
                    </div>
                ) : (
                    campaigns.map((campaign) => (
                        <div key={campaign.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                                <Send className="w-24 h-24" />
                            </div>
                            
                            <div className="flex justify-between items-start mb-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Sent
                                </span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(campaign.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{campaign.title}</h3>
                            <p className="text-gray-600 text-sm mb-6 line-clamp-2 min-h-[40px] italic">
                                "{campaign.message}"
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Users className="w-4 h-4" />
                                    <span className="capitalize">{campaign.targetAudience.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                                    <Activity className="w-3.5 h-3.5" />
                                    Active
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default Campaigns
