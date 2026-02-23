import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

export default function Checkout() {
    const navigate = useNavigate()
    const { items, restaurantId, restaurantName, totalPrice, clearCart } = useCartStore()
    const { user } = useAuthStore()

    const [address, setAddress] = useState(user?.address || '')
    const [phone, setPhone] = useState(user?.phone || '')
    const [instructions, setInstructions] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('razorpay')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const subtotal = totalPrice()
    const deliveryFee = 40
    const taxes = Math.round(subtotal * 0.05)
    const grandTotal = subtotal + deliveryFee + taxes

    useEffect(() => {
        if (items.length === 0) navigate('/cart')
    }, [items, navigate])

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        document.body.appendChild(script)
        return () => document.body.removeChild(script)
    }, [])

    const placeOrder = async () => {
        if (!address.trim()) { setError('Please enter a delivery address'); return }
        setLoading(true); setError('')
        try {
            // 1. Create order in backend → get Razorpay order id
            const { data: orderData } = await api.post('/api/orders', {
                restaurantId,
                deliveryAddress: address,
                phone,
                instructions,
                items: items.map(i => ({ menuItemId: i.id, quantity: i.quantity, unitPrice: i.price })),
                totalAmount: grandTotal,
                paymentMethod,
            })

            if (paymentMethod === 'cod') {
                clearCart()
                navigate(`/orders/${orderData.order.id}`)
                return
            }

            // 2. Open Razorpay checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.razorpayOrder.amount,
                currency: 'INR',
                name: 'FoodRush',
                description: `Order from ${restaurantName}`,
                order_id: orderData.razorpayOrder.id,
                handler: async (response) => {
                    try {
                        // 3. Verify payment on backend
                        await api.post('/api/orders/verify-payment', {
                            orderId: orderData.order.id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpaySignature: response.razorpay_signature,
                        })
                        clearCart()
                        navigate(`/orders/${orderData.order.id}`)
                    } catch {
                        setError('Payment verification failed. Contact support.')
                    }
                },
                prefill: { name: user?.name, email: user?.email, contact: phone },
                theme: { color: '#f97316' },
                modal: { ondismiss: () => setLoading(false) }
            }
            const rzp = new window.Razorpay(options)
            rzp.open()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to place order')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen pb-36">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/5 flex items-center gap-3 px-4 py-3">
                <button onClick={() => navigate(-1)} className="text-xl">←</button>
                <h1 className="font-bold text-lg">Checkout</h1>
            </div>

            <div className="px-4 pt-5 space-y-5">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}

                {/* Delivery Address */}
                <div className="card space-y-3">
                    <h2 className="font-semibold flex items-center gap-2">📍 Delivery Address</h2>
                    <textarea
                        id="delivery-address"
                        className="input resize-none h-20"
                        placeholder="Enter your full delivery address…"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        required
                    />
                    <input
                        id="phone"
                        type="tel"
                        className="input"
                        placeholder="Phone number for delivery"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                    />
                    <input
                        id="instructions"
                        type="text"
                        className="input"
                        placeholder="Delivery instructions (optional)"
                        value={instructions}
                        onChange={e => setInstructions(e.target.value)}
                    />
                </div>

                {/* Order Summary */}
                <div className="card space-y-3">
                    <h2 className="font-semibold flex items-center gap-2">🧾 Order from {restaurantName}</h2>
                    {items.map(i => (
                        <div key={i.id} className="flex justify-between text-sm">
                            <span className="text-gray-300">{i.quantity}× {i.name}</span>
                            <span>₹{(i.price * i.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="border-t border-white/10 pt-2 space-y-1 text-sm">
                        <div className="flex justify-between text-gray-400"><span>Delivery Fee</span><span>₹{deliveryFee}</span></div>
                        <div className="flex justify-between text-gray-400"><span>GST (5%)</span><span>₹{taxes}</span></div>
                        <div className="flex justify-between font-bold text-base pt-1">
                            <span>Total</span><span className="text-brand-500">₹{grandTotal}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Method */}
                <div className="card space-y-3">
                    <h2 className="font-semibold flex items-center gap-2">💳 Payment Method</h2>
                    <div className="space-y-2">
                        {[
                            { id: 'razorpay', label: '💳 Pay Online (UPI / Card / Netbanking)', desc: 'Secure payment via Razorpay' },
                            { id: 'cod', label: '💵 Cash on Delivery', desc: 'Pay when your order arrives' },
                        ].map(method => (
                            <label
                                key={method.id}
                                id={`pay-${method.id}`}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${paymentMethod === method.id
                                        ? 'border-brand-500 bg-brand-500/10'
                                        : 'border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="payment"
                                    value={method.id}
                                    checked={paymentMethod === method.id}
                                    onChange={() => setPaymentMethod(method.id)}
                                    className="accent-brand-500"
                                />
                                <div>
                                    <p className="text-sm font-medium">{method.label}</p>
                                    <p className="text-xs text-gray-500">{method.desc}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Place Order — fixed bottom */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0f0f0f]/95 backdrop-blur border-t border-white/10">
                <button
                    id="place-order-btn"
                    onClick={placeOrder}
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-between px-6 py-4 text-base disabled:opacity-50"
                >
                    <span>{paymentMethod === 'cod' ? '💵 Place Order (COD)' : '💳 Pay & Place Order'}</span>
                    <span>₹{grandTotal}</span>
                </button>
            </div>
        </div>
    )
}
