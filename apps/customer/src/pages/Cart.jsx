import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import confetti from 'canvas-confetti'

const VALID_COUPONS = {
    'FOODRUSH': { discount: 0.10, label: '10% OFF', max: 100 },
    'FIRST50': { discount: 0.50, label: '50% OFF up to ₹100', max: 100 },
    'FLAT20': { discount: 0, flat: 20, label: '₹20 flat off' },
}

export default function Cart() {
    const { items, restaurantName, updateQuantity, removeItem, clearCart, totalPrice } = useCartStore()
    const navigate = useNavigate()
    const [coupon, setCoupon] = useState('')
    const [appliedCoupon, setAppliedCoupon] = useState(null)
    const [couponError, setCouponError] = useState('')
    const [addDonation, setAddDonation] = useState(false)

    const subtotal = totalPrice()
    // Dynamic Pricing / Surge Fee
    const currentHour = new Date().getHours()
    const isSurgeHour = (currentHour >= 12 && currentHour <= 14) || (currentHour >= 19 && currentHour <= 21)
    const surgeFee = isSurgeHour && items.length > 0 ? 25 : 0

    // Free delivery above ₹299
    const deliveryFee = (items.length > 0 && subtotal < 299) ? 40 : 0
    const platformFee = items.length > 0 ? 4 : 0
    const packagingFee = items.length > 0 ? 15 : 0
    const donation = addDonation ? 2 : 0
    const taxes = Math.round(subtotal * 0.05)
    const amountForFreeDelivery = Math.max(0, 299 - subtotal)
    const freeDeliveryProgress = Math.min(100, (subtotal / 299) * 100)

    const applyCoupon = () => {
        const code = coupon.trim().toUpperCase()
        const found = VALID_COUPONS[code]
        if (!found) { setCouponError('Invalid coupon code'); setAppliedCoupon(null); return }
        setAppliedCoupon({ code, ...found })
        setCouponError('')

        // Gamification: Trigger confetti!
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f97316', '#22c55e', '#ffffff'] // Brand orange, green, white
        })
    }

    const removeCoupon = () => { setAppliedCoupon(null); setCoupon(''); setCouponError('') }

    let discount = 0
    if (appliedCoupon) {
        if (appliedCoupon.flat) discount = appliedCoupon.flat
        else discount = Math.min(subtotal * appliedCoupon.discount, appliedCoupon.max)
    }

    const grandTotal = Math.max(0, subtotal + deliveryFee + platformFee + packagingFee + surgeFee + taxes + donation - discount)

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
                <div className="text-7xl">🛒</div>
                <h1 className="text-2xl font-bold">Your cart is empty</h1>
                <p className="text-gray-400">Browse restaurants and add items to get started</p>
                <Link to="/" className="btn-primary mt-2">Browse Restaurants</Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-36">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/5 flex items-center gap-3 px-4 py-3">
                <button onClick={() => navigate(-1)} className="text-xl">←</button>
                <div>
                    <h1 className="font-bold text-lg">Your Cart</h1>
                    <p className="text-gray-400 text-xs">{restaurantName}</p>
                </div>
            </div>

            <div className="px-4 pt-4 space-y-4">
                {/* Free Delivery Progress */}
                <div className="card bg-gradient-to-r from-brand-500/10 to-transparent border-brand-500/20 p-4">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <h3 className="font-bold text-sm text-brand-400">
                                {amountForFreeDelivery > 0 ? `Add ₹${amountForFreeDelivery.toFixed(0)} more for Free Delivery` : '🎉 You unlocked Free Delivery!'}
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">Orders above ₹299 get free delivery</p>
                        </div>
                        <span className="text-2xl">{amountForFreeDelivery > 0 ? '🛵' : '✨'}</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-brand-500 h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${freeDeliveryProgress}%` }}
                        />
                    </div>
                </div>

                {/* Items */}
                <div className="card p-0 overflow-hidden divide-y divide-white/5">
                    {items.map(item => (
                        <div key={item.id} id={`cart-item-${item.id}`} className="card flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.name}</p>
                                <p className="text-brand-500 text-sm font-semibold">₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(0)}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button id={`dec-${item.id}`} onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-brand-500 flex items-center justify-center font-bold transition-colors">−</button>
                                <span className="w-5 text-center font-semibold">{item.quantity}</span>
                                <button id={`inc-${item.id}`} onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-brand-500 flex items-center justify-center font-bold transition-colors">+</button>
                            </div>
                            <button id={`remove-${item.id}`} onClick={() => removeItem(item.id)}
                                className="text-red-400 hover:text-red-300 text-lg ml-1">🗑️</button>
                        </div>
                    ))}
                </div>

                <Link to="/" className="flex items-center justify-center gap-2 text-brand-500 text-sm py-3 bg-brand-500/5 rounded-xl border border-brand-500/20 hover:bg-brand-500/10 transition-colors font-medium">
                    + Add more items
                </Link>

                {/* Coupon code */}
                <div className="card space-y-3">
                    <h2 className="font-semibold flex items-center gap-2 text-sm">🎟️ Apply Coupon</h2>
                    {appliedCoupon ? (
                        <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                            <div>
                                <p className="font-semibold text-green-400">✅ {appliedCoupon.code}</p>
                                <p className="text-xs text-gray-400">{appliedCoupon.label} applied · Saving ₹{discount.toFixed(0)}</p>
                            </div>
                            <button onClick={removeCoupon} className="text-red-400 text-sm hover:underline">Remove</button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                id="coupon-input"
                                className="input flex-1 uppercase placeholder:normal-case"
                                placeholder="Enter coupon code (e.g. FOODRUSH)"
                                value={coupon}
                                onChange={e => { setCoupon(e.target.value); setCouponError('') }}
                                onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                            />
                            <button id="apply-coupon-btn" onClick={applyCoupon}
                                className="btn-primary px-4 py-2 text-sm shrink-0">Apply</button>
                        </div>
                    )}
                    {couponError && <p className="text-red-400 text-xs">{couponError}</p>}
                    {!appliedCoupon && (
                        <div className="flex gap-2 flex-wrap">
                            {Object.keys(VALID_COUPONS).map(code => (
                                <button key={code} onClick={() => { setCoupon(code); setCouponError('') }}
                                    className="text-xs bg-brand-500/10 text-brand-500 border border-brand-500/20 px-3 py-1 rounded-full hover:bg-brand-500/20 transition-colors">
                                    {code}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Donation Toggle */}
                <div className="card flex items-center justify-between p-4 cursor-pointer" onClick={() => setAddDonation(!addDonation)}>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🌱</span>
                        <div>
                            <p className="font-bold text-sm">Feeding India Donation</p>
                            <p className="text-xs text-gray-400">Working towards a malnutrition-free nation.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">₹2</span>
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${addDonation ? 'bg-brand-500 border-brand-500' : 'border-white/20'}`}>
                            {addDonation && <span className="text-white text-xs">✓</span>}
                        </div>
                    </div>
                </div>

                {/* Bill Summary */}
                <div className="card space-y-3">
                    <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">Bill Summary</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-400">Item Total</span><span>₹{subtotal.toFixed(0)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Delivery Fee</span><span>₹{deliveryFee}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Packaging Charges</span><span>₹{packagingFee}</span></div>
                        {surgeFee > 0 && (
                            <div className="flex justify-between">
                                <span className="text-brand-400 flex items-center gap-1">📈 High Demand Surge <span title="Extra fee due to peak hour traffic">ℹ️</span></span>
                                <span>₹{surgeFee}</span>
                            </div>
                        )}
                        <div className="flex justify-between"><span className="text-gray-400">Platform Fee</span><span>₹{platformFee}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Taxes (GST)</span><span>₹{taxes}</span></div>
                        {addDonation && <div className="flex justify-between"><span className="text-gray-400">Feeding India Donation</span><span>₹{donation}</span></div>}
                        {discount > 0 && (
                            <div className="flex justify-between text-green-400">
                                <span>Coupon Discount ({appliedCoupon?.code})</span>
                                <span>−₹{discount.toFixed(0)}</span>
                            </div>
                        )}
                        <div className="border-t border-white/10 pt-3 mt-1 flex justify-between font-bold text-base">
                            <span>To Pay</span><span className="text-brand-500">₹{grandTotal.toFixed(0)}</span>
                        </div>
                        {discount > 0 && (
                            <p className="text-green-400 text-xs text-center bg-green-500/10 rounded-lg py-2 mt-2 font-medium border border-green-500/20">
                                🎉 You're saving ₹{discount.toFixed(0)} on this order!
                            </p>
                        )}
                    </div>
                </div>

                <div className="text-center pt-2">
                    <button id="clear-cart-btn" onClick={() => { clearCart(); navigate('/') }}
                        className="text-sm text-red-400 hover:text-red-300 py-1 transition-colors">🗑️ Clear entire cart</button>
                </div>
            </div>

            {/* Fixed bottom checkout button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0f0f0f]/95 backdrop-blur border-t border-white/10">
                <Link to="/checkout" id="checkout-btn" state={{ discount, couponCode: appliedCoupon?.code, donation, platformFee, packagingFee, surgeFee }}
                    className="btn-primary w-full flex items-center justify-between px-6 py-4 text-base shadow-xl shadow-brand-500/20">
                    <div className="flex flex-col items-start gap-1">
                        <span className="font-bold">₹{grandTotal.toFixed(0)}</span>
                        <span className="text-[10px] uppercase tracking-wide opacity-80 decoration-dotted underline">TOTAL</span>
                    </div>
                    <span className="font-bold text-lg">Checkout ➔</span>
                </Link>
            </div>
        </div>
    )
}
