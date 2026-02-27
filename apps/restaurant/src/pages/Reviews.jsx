import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'

export default function Reviews() {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/api/restaurants/me/reviews')
            .then(r => setReviews(r.data))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const averageRating = reviews.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 'No Ratings'

    return (
        <div className="min-h-screen pb-10">
            <div className="sticky top-0 z-10 bg-[#0d0a12]/95 backdrop-blur border-b border-white/5 flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <Link to="/" className="text-xl">←</Link>
                    <h1 className="font-bold">Customer Reviews</h1>
                </div>
            </div>

            <div className="px-4 pt-6 space-y-5">
                <div className="card text-center p-6 space-y-2">
                    <p className="text-4xl font-bold text-yellow-400">⭐ {averageRating}</p>
                    <p className="text-sm text-gray-400">Based on {reviews.length} reviews</p>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="card h-24 animate-pulse" />)
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <div className="text-4xl mb-3">💬</div>
                            <p>No reviews yet.</p>
                        </div>
                    ) : (
                        reviews.map(review => (
                            <div key={review.id} className="card space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{review.customer?.name || 'Anonymous'}</p>
                                        <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex text-yellow-400 text-sm">
                                        {'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                    </div>
                                </div>
                                {review.comment ? (
                                    <p className="text-sm text-gray-300 italic">"{review.comment}"</p>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No comment provided.</p>
                                )}
                                {review.order && (
                                    <div className="text-xs text-gray-400 mt-2 bg-white/5 px-2 py-1 rounded inline-block">
                                        Order #{review.order.id.slice(-6).toUpperCase()} · ₹{review.order.totalAmount}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
