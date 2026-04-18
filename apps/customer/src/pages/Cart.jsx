import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useGroupOrderStore } from '../store/groupOrderStore'
import confetti from 'canvas-confetti'

const VALID_COUPONS = {
    'FOODRUSH': { discount: 0.10, label: '10% OFF', max: 100 },
    'FIRST50': { discount: 0.50, label: '50% OFF up to ₹100', max: 100 },
    'FLAT20': { discount: 0, flat: 20, label: '₹20 flat off' },
}

export default function Cart() {
    const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCartStore()
    const { activeGroupId } = useGroupOrderStore()
    const navigate = useNavigate()
    const [coupon, setCoupon] = useState('')
    const [appliedCoupon, setAppliedCoupon] = useState(null)
    const [couponError, setCouponError] = useState('')
    const [addDonation, setAddDonation] = useState(false)

    // Group items by restaurant
    const groupedItems = items.reduce((acc, item) => {
        const rName = item.restaurantName || 'Unknown Restaurant'
        if (!acc[rName]) acc[rName] = []
        acc[rName].push(item)
        return acc
    }, {})

    const numRestaurants = Object.keys(groupedItems).length

    // Free delivery above ₹299
    const subtotal = totalPrice()

    // Dynamic Pricing / Surge Fee
    const currentHour = new Date().getHours()
    const isSurgeHour = (currentHour >= 12 && currentHour <= 14) || (currentHour >= 19 && currentHour <= 21)
    const surgeFee = isSurgeHour && items.length > 0 ? 25 : 0
    let deliveryFee = 0;
    if (items.length > 0 && subtotal < 299) {
        // Base ₹40 + ₹20 for each additional restaurant due to extra distance
        deliveryFee = 40 + ((numRestaurants - 1) * 20);
    }
    const platformFee = items.length > 0 ? 4 : 0
    const packagingFee = items.length > 0 ? 15 * numRestaurants : 0
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

    if (activeGroupId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4 bg-gray-50 text-gray-900">
                <div className="text-7xl animate-pulse mb-2">👥</div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-brand-500">Group Order Active!</h1>
                <p className="text-gray-500 max-w-sm">You are currently participating in a Group Order. The regular cart is disabled until the group order is completed or left.</p>
                <Link to={`/group-order/${activeGroupId}`} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl mt-4 shadow-lg transition-transform hover:scale-105 flex items-center gap-2">
                    <span>Return to Shared Cart</span>
                    <span>➔</span>
                </Link>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4 bg-gray-50 text-gray-900">
                <div className="text-7xl">🛒</div>
                <h1 className="text-2xl font-bold">Your cart is empty</h1>
                <p className="text-gray-500">Browse restaurants and add items to get started</p>
                <Link to="/" className="btn-primary mt-2">Browse Restaurants</Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-36 bg-gray-50 text-gray-900">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center gap-3 px-4 py-3 shadow-sm">
                <button onClick={() => navigate(-1)} className="text-xl text-gray-600 hover:text-gray-900 transition-colors">←</button>
                <div>
                    <h1 className="font-bold text-lg text-gray-900">Your Cart</h1>
                    <p className="text-gray-500 text-xs">Multi-Restaurant Global Cart</p>
                </div>
            </div>

            <div className="px-4 pt-4 space-y-4">
                {/* Combined Delivery Progress */}
                <div className="card bg-gradient-to-r from-brand-500/10 to-transparent border-brand-500/20 p-4">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <h3 className="font-bold text-sm text-brand-400">
                                {numRestaurants > 1
                                    ? `Combined Order from ${numRestaurants} places`
                                    : amountForFreeDelivery > 0 ? `Add ₹${amountForFreeDelivery.toFixed(0)} more for Free Delivery` : '🎉 You unlocked Free Delivery!'}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {numRestaurants > 1
                                    ? 'A single rider may pick up your whole order, or we may dispatch multiple riders to ensure it arrives hot! Base delivery fee applies with extra distance surcharge.'
                                    : 'Orders above ₹299 get free delivery'}
                            </p>
                        </div>
                        <span className="text-2xl">{amountForFreeDelivery > 0 ? '🛵' : '✨'}</span>
                    </div>
                    {numRestaurants === 1 && (
                        <div className="w-full bg-brand-500/10 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-brand-500 h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${freeDeliveryProgress}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Items */}
                <div className="card p-0 overflow-hidden divide-y divide-gray-100">
                    {Object.entries(groupedItems).map(([rName, rItems]) => (
                        <div key={rName}>
                            <div className="bg-gray-50 px-4 py-2 text-sm font-bold text-gray-600 border-b border-gray-100">
                                {rName}
                            </div>
                            <div className="divide-y divide-gray-50">
                                {rItems.map(item => (
                                    <div key={item.id} id={`cart-item-${item.id}`} className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold truncate text-gray-900">{item.name}</p>
                                            <p className="text-brand-500 text-sm font-bold mt-0.5">₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(0)}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button id={`dec-${item.id}`} onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-brand-500 text-gray-700 hover:text-white flex items-center justify-center font-bold transition-all shadow-sm">−</button>
                                            <span className="w-5 text-center font-bold text-gray-900">{item.quantity}</span>
                                            <button id={`inc-${item.id}`} onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-brand-500 text-gray-700 hover:text-white flex items-center justify-center font-bold transition-all shadow-sm">+</button>
                                        </div>
                                        <button id={`remove-${item.id}`} onClick={() => removeItem(item.id)}
                                            className="text-gray-400 hover:text-red-500 text-lg ml-1 p-2 transition-colors">🗑️</button>
                                    </div>
                                ))}
                            </div>
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
                <div className="card flex items-center justify-between p-4 cursor-pointer hover:border-brand-500/30 transition-colors" onClick={() => setAddDonation(!addDonation)}>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🌱</span>
                        <div>
                            <p className="font-bold text-sm text-gray-900">Feeding India Donation</p>
                            <p className="text-xs text-gray-500">Working towards a malnutrition-free nation.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-700">₹2</span>
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all shadow-sm ${addDonation ? 'bg-brand-500 border-brand-500 shadow-brand-500/20' : 'border-gray-300 bg-gray-50'}`}>
                            {addDonation && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                    </div>
                </div>

                {/* Bill Summary */}
                <div className="card space-y-3">
                    <h2 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4">Bill Summary</h2>
                    <div className="space-y-2.5 text-sm font-medium">
                        <div className="flex justify-between"><span className="text-gray-500">Item Total</span><span className="text-gray-900">₹{subtotal.toFixed(0)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Delivery Fee</span><span className="text-gray-900">₹{deliveryFee}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Packaging Charges</span><span className="text-gray-900">₹{packagingFee}</span></div>
                        {surgeFee > 0 && (
                            <div className="flex justify-between">
                                <span className="text-brand-500 flex items-center gap-1 font-semibold">📈 High Demand Surge <span title="Extra fee due to peak hour traffic">ℹ️</span></span>
                                <span className="text-brand-500 font-bold">₹{surgeFee}</span>
                            </div>
                        )}
                        <div className="flex justify-between"><span className="text-gray-500">Platform Fee</span><span className="text-gray-900">₹{platformFee}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Taxes (GST)</span><span className="text-gray-900">₹{taxes}</span></div>
                        {addDonation && <div className="flex justify-between"><span className="text-gray-500">Feeding India Donation</span><span className="text-gray-900">₹{donation}</span></div>}
                        {discount > 0 && (
                            <div className="flex justify-between text-green-600 font-bold">
                                <span className="bg-green-50 px-2 py-0.5 rounded">Coupon Discount ({appliedCoupon?.code})</span>
                                <span>−₹{discount.toFixed(0)}</span>
                            </div>
                        )}
                        <div className="border-t border-gray-100 pt-3 mt-2 flex justify-between font-black text-base text-gray-900">
                            <span>To Pay</span><span className="text-brand-600">₹{grandTotal.toFixed(0)}</span>
                        </div>
                        {discount > 0 && (
                            <p className="text-green-700 text-xs text-center bg-green-50 rounded-xl py-2 mt-3 font-bold border border-green-100">
                                🎉 You're saving ₹{discount.toFixed(0)} on this order!
                            </p>
                        )}
                    </div>
                </div>

                <div className="text-center pt-2">
                    <button id="clear-cart-btn" onClick={() => { clearCart(); navigate('/') }}
                        className="text-sm font-medium text-gray-400 hover:text-red-500 py-2 px-4 rounded-xl hover:bg-red-50 transition-all">🗑️ Clear entire cart</button>
                </div>
            </div>

            {/* Fixed bottom checkout button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-8px_20px_-5px_rgba(0,0,0,0.05)] z-20">
                <Link to="/checkout" id="checkout-btn" state={{ discount, couponCode: appliedCoupon?.code, donation, platformFee, packagingFee, surgeFee }}
                    className="btn-primary w-full flex items-center justify-between px-6 py-4 text-base shadow-xl shadow-brand-500/20 ring-2 ring-transparent hover:ring-brand-500/50">
                    <div className="flex flex-col items-start translate-y-[2px]">
                        <span className="font-black text-lg leading-none">₹{grandTotal.toFixed(0)}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-90 mt-1">TOTAL</span>
                    </div>
                    <span className="font-black text-lg">Checkout ➔</span>
                </Link>
            </div>
        </div>
    )
}
