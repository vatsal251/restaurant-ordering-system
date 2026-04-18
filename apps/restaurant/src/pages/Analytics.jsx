import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../lib/api'

export default function Analytics() {
    const [orders, setOrders] = useState([])
    const [menuItems, setMenuItems] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            api.get('/api/restaurants/me/orders'),
            api.get('/api/restaurants/me/menu'),
        ]).then(([o, m]) => {
            setOrders(o.data)
            setMenuItems(m.data)
        }).catch(() => { }).finally(() => setLoading(false))
    }, [])

    const delivered = orders.filter(o => o.status === 'delivered')
    const totalRevenue = delivered.reduce((s, o) => s + o.totalAmount, 0)
    const avgOrder = delivered.length ? (totalRevenue / delivered.length) : 0

    // Popular items
    const itemCounts = {}
    delivered.forEach(o => {
        o.orderItems?.forEach(i => {
            const name = i.menuItem?.name || 'Unknown'
            itemCounts[name] = (itemCounts[name] || 0) + i.quantity
        })
    })
    const topItems = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

    // Orders by status
    const statusCounts = orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1
        return acc
    }, {})

    const dailyDataMap = {}
    delivered.forEach(o => {
        const date = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (!dailyDataMap[date]) dailyDataMap[date] = { date, revenue: 0, orders: 0 }
        dailyDataMap[date].revenue += o.totalAmount
        dailyDataMap[date].orders += 1
    })
    const trendData = Object.values(dailyDataMap)

    if (trendData.length === 0) {
        trendData.push({ date: 'Today', revenue: 0, orders: 0 })
    }

    // Advanced: Orders by Time of Day Heatmap
    const timeOfDayCounts = { Morning: 0, Lunch: 0, Afternoon: 0, Dinner: 0, LateNight: 0 }
    orders.forEach(o => {
        const hour = new Date(o.createdAt).getHours()
        if (hour >= 6 && hour < 11) timeOfDayCounts.Morning++
        else if (hour >= 11 && hour < 14) timeOfDayCounts.Lunch++
        else if (hour >= 14 && hour < 17) timeOfDayCounts.Afternoon++
        else if (hour >= 17 && hour < 22) timeOfDayCounts.Dinner++
        else timeOfDayCounts.LateNight++
    })
    const timeOfDayData = Object.entries(timeOfDayCounts).map(([time, count]) => ({ time, count }))

    // Advanced: Order Density by Zip Code (Mock Extraction from Address string)
    // Assuming address format contains zip code at the end, or falls back to generic.
    const zipCounts = {}
    orders.forEach(o => {
        const match = o.deliveryAddress?.match(/\b\d{6}\b/) // Indian 6-digit PIN code
        const zip = match ? match[0] : 'Other'
        zipCounts[zip] = (zipCounts[zip] || 0) + 1
    })
    const zipData = Object.entries(zipCounts).map(([zip, count]) => ({ zip, count })).sort((a, b) => b.count - a.count).slice(0, 5)

    return (
        <div className="min-h-screen pb-10">
            <div className="sticky top-0 z-10 bg-[#0d0a12]/95 backdrop-blur border-b border-white/5 flex items-center gap-3 px-4 py-3">
                <Link to="/" className="text-xl">←</Link>
                <h1 className="font-bold text-lg">Analytics</h1>
            </div>

            <div className="px-4 pt-5 space-y-5">
                {loading ? (
                    <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="card animate-pulse h-24" />)}</div>
                ) : (
                    <>
                        {/* Revenue summary */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="card text-center p-4 border border-brand-500/20">
                                <p className="text-3xl font-bold text-brand-500">₹{totalRevenue.toFixed(0)}</p>
                                <p className="text-xs text-gray-400 mt-1">Total Revenue</p>
                            </div>
                            <div className="card text-center p-4">
                                <p className="text-3xl font-bold text-green-400">{delivered.length}</p>
                                <p className="text-xs text-gray-400 mt-1">Completed Orders</p>
                            </div>
                            <div className="card text-center p-4">
                                <p className="text-3xl font-bold text-yellow-400">{orders.length}</p>
                                <p className="text-xs text-gray-400 mt-1">Total Orders</p>
                            </div>
                            <div className="card text-center p-4">
                                <p className="text-3xl font-bold text-purple-400">₹{avgOrder.toFixed(0)}</p>
                                <p className="text-xs text-gray-400 mt-1">Avg Order Value</p>
                            </div>
                        </div>

                        {/* Revenue Chart */}
                        <div className="card space-y-3 pb-6">
                            <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">Revenue Trends</h3>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendData}>
                                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Menu stats */}
                        <div className="card space-y-2">
                            <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">Menu Overview</h3>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Total Items</span>
                                <span className="font-semibold">{menuItems.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Available</span>
                                <span className="text-green-400 font-semibold">{menuItems.filter(i => i.isAvailable).length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Unavailable</span>
                                <span className="text-red-400 font-semibold">{menuItems.filter(i => !i.isAvailable).length}</span>
                            </div>
                        </div>

                        {/* Order status breakdown */}
                        <div className="card space-y-3">
                            <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">Order Status</h3>
                            {Object.entries(statusCounts).map(([status, count]) => (
                                <div key={status} className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-300 capitalize">{status.replace(/_/g, ' ')}</span>
                                            <span className="text-gray-400">{count}</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-brand-500 rounded-full"
                                                style={{ width: `${Math.min((count / orders.length) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Advanced Analytics Heatmaps */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Time of Day Matrix */}
                            <div className="card space-y-3">
                                <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">🕐 Traffic by Time</h3>
                                <div className="h-44 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={timeOfDayData} layout="vertical" margin={{ left: 10 }}>
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="time" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }} />
                                            <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            {/* Location ZIP Matrix */}
                            <div className="card space-y-3">
                                <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">📍 Top ZIP Codes</h3>
                                <div className="h-44 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={zipData} layout="vertical" margin={{ left: 10 }}>
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="zip" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }} />
                                            <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Top items */}
                        {topItems.length > 0 && (
                            <div className="card space-y-3">
                                <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">🔥 Popular Items</h3>
                                {topItems.map(([name, count], i) => (
                                    <div key={name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-600 text-sm w-4">{i + 1}</span>
                                            <span className="text-sm font-medium">{name}</span>
                                        </div>
                                        <span className="text-xs text-brand-500 font-semibold bg-brand-500/10 px-2 py-0.5 rounded-full">
                                            {count} sold
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {orders.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-5xl mb-3">📊</div>
                                <p>No orders yet. Analytics will appear once you receive orders.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
