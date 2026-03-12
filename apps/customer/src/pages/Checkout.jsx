import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import confetti from 'canvas-confetti'

export default function Checkout() {
    const navigate = useNavigate()
    const { items, totalPrice, clearCart } = useCartStore()
    const { user } = useAuthStore()

    const [address, setAddress] = useState(user?.address || '')
    const [savedAddresses, setSavedAddresses] = useState([])
    const [phone, setPhone] = useState(user?.phone || '')
    const [instructions, setInstructions] = useState('')
    const [cookingInstructions, setCookingInstructions] = useState('')
    const [tipAmount, setTipAmount] = useState(0)
    const [promoCode, setPromoCode] = useState('')
    const [appliedPromo, setAppliedPromo] = useState(null)
    const [promoError, setPromoError] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('upi')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const location = useLocation()
    const donation = location.state?.donation || 0
    const platformFee = items.length > 0 ? 4 : 0
    const packagingFee = items.length > 0 ? 15 : 0
    const surgeFee = location.state?.surgeFee || 0

    const subtotal = totalPrice()

    let discount = 0
    if (appliedPromo) {
        discount = appliedPromo.type === 'percentage'
            ? subtotal * (appliedPromo.discount / 100)
            : appliedPromo.discount
    }
    const discountedSubtotal = Math.max(0, subtotal - discount)

    const deliveryFee = subtotal >= 299 ? 0 : 40
    const taxes = Math.round(discountedSubtotal * 0.05)
    // Add tip amount strictly as a number to avoid string concatenation
    const grandTotal = discountedSubtotal + deliveryFee + packagingFee + platformFee + surgeFee + taxes + donation + Number(tipAmount)

    useEffect(() => {
        if (items.length === 0) navigate('/cart')
    }, [items, navigate])

    // Load saved addresses
    useEffect(() => {
        api.get('/api/addresses')
            .then(res => {
                setSavedAddresses(res.data)
                const defaultAddr = res.data.find(a => a.isDefault) || res.data[0]
                if (defaultAddr && !address) {
                    const formatted = [defaultAddr.street, defaultAddr.city, defaultAddr.state, defaultAddr.zip].filter(Boolean).join(', ')
                    setAddress(formatted)
                }
            })
            .catch(() => { })
    }, [])

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        document.body.appendChild(script)
        return () => document.body.removeChild(script)
    }, [])

    const applyPromo = async () => {
        if (!promoCode.trim()) return
        setPromoError(''); setAppliedPromo(null)
        try {
            // For multi-restaurant, we omit restaurantId check for global promos, or pick the first item's restaurant.
            // Simplified: don't pass restaurantId to allow only global promos or those valid for the cart.
            const { data } = await api.post('/api/orders/validate-promo', { code: promoCode })
            setAppliedPromo(data)

            // Gamification: Trigger confetti!
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#f97316', '#22c55e', '#ffffff'] // Brand orange, green, white
            })
        } catch (err) {
            setPromoError(err.response?.data?.message || 'Invalid promo code')
        }
    }

    const placeOrder = async () => {
        if (!address.trim()) { setError('Please enter a delivery address'); return }
        setLoading(true); setError('')
        try {
            // 1. Create order in backend → get Razorpay order id
            const { data: orderData } = await api.post('/api/orders', {
                deliveryAddress: address,
                phone,
                instructions,
                cookingInstructions,
                tipAmount: Number(tipAmount),
                promoCodeId: appliedPromo?.id,
                items: items.map(i => ({ menuItemId: i.id, quantity: i.quantity, unitPrice: i.price, restaurantId: i.restaurantId })),
                totalAmount: grandTotal,
                paymentMethod: paymentMethod === 'cod' ? 'cod' : 'razorpay',
            })

            if (paymentMethod === 'cod') {
                clearCart()
                navigate(orderData.orders.length > 1 ? '/orders' : `/orders/${orderData.orders[0].id}`)
                return
            }

            // 2. Open Razorpay checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.razorpayOrder.amount,
                currency: 'INR',
                name: 'FoodRush',
                description: `Order from ${orderData.orders.length > 1 ? 'Multiple Restaurants' : 'Restaurant'}`,
                order_id: orderData.razorpayOrder.id,
                handler: async (response) => {
                    try {
                        // 3. Verify payment on backend
                        await api.post('/api/orders/verify-payment', {
                            orderId: orderData.orders.map(o => o.id),
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpaySignature: response.razorpay_signature,
                        })
                        clearCart()
                        navigate(orderData.orders.length > 1 ? '/orders' : `/orders/${orderData.orders[0].id}`)
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
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center gap-3 px-4 py-3 shadow-sm">
                <button onClick={() => navigate(-1)} className="text-xl text-gray-600 hover:text-gray-900 transition-colors">←</button>
                <h1 className="font-bold text-lg text-gray-900">Checkout</h1>
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

                    {savedAddresses.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {savedAddresses.map(a => {
                                const formatted = [a.street, a.city, a.state, a.zip].filter(Boolean).join(', ')
                                return (
                                    <button
                                        key={a.id}
                                        onClick={() => setAddress(formatted)}
                                        className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm transition-colors ${address === formatted ? 'bg-brand-500/10 border-brand-500 text-brand-500' : 'border-white/10 text-gray-400 hover:border-white/30'}`}
                                    >
                                        <span>{a.type === 'home' ? '🏠' : a.type === 'work' ? '🏢' : '📍'}</span>
                                        <span className="capitalize font-medium">{a.type}</span>
                                    </button>
                                )
                            })}
                        </div>
                    )}

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
                        placeholder="Delivery instructions (e.g., Leave at door)"
                        value={instructions}
                        onChange={e => setInstructions(e.target.value)}
                    />
                    <input
                        id="cooking-instructions"
                        type="text"
                        className="input"
                        placeholder="Cooking instructions (e.g., Make it spicy)"
                        value={cookingInstructions}
                        onChange={e => setCookingInstructions(e.target.value)}
                    />
                </div>

                {/* Offers & Tips */}
                <div className="card space-y-4">
                    <div>
                        <h2 className="font-semibold flex items-center gap-2 mb-2">🏷️ Apply Promo Code</h2>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="input uppercase"
                                placeholder="TRYNEW"
                                value={promoCode}
                                onChange={e => setPromoCode(e.target.value)}
                            />
                            <button onClick={applyPromo} className="btn-primary whitespace-nowrap px-4">Apply</button>
                        </div>
                        {appliedPromo && <p className="text-green-400 text-sm mt-1">✔ Promo '{appliedPromo.code}' applied!</p>}
                        {promoError && <p className="text-red-400 text-sm mt-1">{promoError}</p>}
                    </div>

                    <div className="border-t border-white/10 pt-4">
                        <h2 className="font-semibold flex items-center gap-2 mb-2">💝 Tip your delivery partner</h2>
                        <div className="flex gap-2">
                            {[0, 10, 20, 50].map(amt => (
                                <button
                                    key={amt}
                                    onClick={() => setTipAmount(amt)}
                                    className={`flex-1 py-2 rounded-xl border text-sm transition-colors ${tipAmount === amt ? 'bg-brand-500/20 border-brand-500 text-brand-500' : 'border-white/10 hover:border-white/30 text-gray-300'}`}
                                >
                                    {amt === 0 ? 'No Tip' : `₹${amt}`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="card space-y-3">
                    <h2 className="font-semibold flex items-center gap-2">🧾 Order Overview</h2>
                    {items.map(i => (
                        <div key={i.id} className="flex justify-between text-sm">
                            <div className="flex flex-col">
                                <span className="text-gray-300">{i.quantity}× {i.name}</span>
                                <span className="text-[10px] text-gray-500">{i.restaurantName}</span>
                            </div>
                            <span>₹{(i.price * i.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="border-t border-white/10 pt-2 space-y-1 text-sm">
                        <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                        {discount > 0 && <div className="flex justify-between text-green-400"><span>Discount</span><span>-₹{discount.toFixed(2)}</span></div>}
                        <div className="flex justify-between text-gray-400">
                            <span>Delivery Fee</span>
                            {deliveryFee === 0 ? <span className="text-green-400 font-medium">FREE</span> : <span>₹{deliveryFee}</span>}
                        </div>
                        <div className="flex justify-between text-gray-400"><span>Packaging</span><span>₹{packagingFee}</span></div>
                        {surgeFee > 0 && <div className="flex justify-between text-brand-400"><span>📈 High Demand Surge</span><span>₹{surgeFee}</span></div>}
                        <div className="flex justify-between text-gray-400"><span>Platform Fee</span><span>₹{platformFee}</span></div>
                        <div className="flex justify-between text-gray-400"><span>GST (5%)</span><span>₹{taxes}</span></div>
                        {donation > 0 && <div className="flex justify-between text-gray-400"><span>Feeding India Donation</span><span>₹{donation}</span></div>}
                        {tipAmount > 0 && <div className="flex justify-between text-brand-400"><span>Delivery Tip</span><span>₹{tipAmount}</span></div>}
                        <div className="flex justify-between font-bold text-base pt-1 border-t border-white/5 mt-1">
                            <span>Total</span><span className="text-brand-500">₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Method */}
                <div className="card space-y-3">
                    <h2 className="font-semibold flex items-center gap-2">💳 Payment Method</h2>
                    <div className="space-y-3">
                        {[
                            { id: 'upi', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm', icon: '⚡' },
                            { id: 'cards', label: 'Credit / Debit Cards', desc: 'Secure payment via Razorpay', icon: '💳' },
                            { id: 'wallets', label: 'Wallets', desc: 'Amazon Pay, MobiKwik, etc.', icon: '👛' },
                            { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives', icon: '💵' },
                        ].map(method => (
                            <label
                                key={method.id}
                                id={`pay-${method.id}`}
                                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === method.id
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
                                    className="accent-brand-500 shrink-0"
                                />
                                <span className="text-2xl opacity-80">{method.icon}</span>
                                <div>
                                    <p className="text-sm font-bold text-white mb-0.5">{method.label}</p>
                                    <p className="text-[11px] text-gray-400 font-medium tracking-wide uppercase">{method.desc}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Place Order — fixed bottom */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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
