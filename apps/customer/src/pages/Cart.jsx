import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'

export default function Cart() {
    const { items, restaurantName, updateQuantity, removeItem, clearCart, totalPrice } = useCartStore()
    const [switchWarning, setSwitchWarning] = useState(false)
    const navigate = useNavigate()

    const subtotal = totalPrice()
    const deliveryFee = items.length > 0 ? 40 : 0
    const taxes = Math.round(subtotal * 0.05)
    const grandTotal = subtotal + deliveryFee + taxes

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

            <div className="px-4 pt-4 space-y-3">
                {/* Items */}
                {items.map(item => (
                    <div key={item.id} id={`cart-item-${item.id}`} className="card flex items-center gap-4">
                        <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-brand-500 text-sm font-semibold">₹{item.price}</p>
                        </div>
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2">
                            <button
                                id={`dec-${item.id}`}
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-brand-500 flex items-center justify-center font-bold transition-colors"
                            >−</button>
                            <span className="w-5 text-center font-semibold">{item.quantity}</span>
                            <button
                                id={`inc-${item.id}`}
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-brand-500 flex items-center justify-center font-bold transition-colors"
                            >+</button>
                        </div>
                        <button
                            id={`remove-${item.id}`}
                            onClick={() => removeItem(item.id)}
                            className="text-red-400 hover:text-red-300 text-lg ml-2"
                        >🗑️</button>
                    </div>
                ))}

                {/* Add more items */}
                <Link to="/" className="flex items-center gap-2 text-brand-500 text-sm py-2 hover:underline">
                    + Add more items
                </Link>

                {/* Price breakdown */}
                <div className="card space-y-3 mt-4">
                    <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">Bill Summary</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Item Total</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Delivery Fee</span>
                            <span>₹{deliveryFee}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">GST (5%)</span>
                            <span>₹{taxes}</span>
                        </div>
                        <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-base">
                            <span>Grand Total</span>
                            <span className="text-brand-500">₹{grandTotal}</span>
                        </div>
                    </div>
                </div>

                {/* Clear cart */}
                <button
                    id="clear-cart-btn"
                    onClick={() => { clearCart(); navigate('/') }}
                    className="text-sm text-red-400 hover:text-red-300 py-1"
                >
                    Clear cart
                </button>
            </div>

            {/* Proceed to checkout — fixed bottom */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0f0f0f]/95 backdrop-blur border-t border-white/10">
                <Link
                    to="/checkout"
                    id="checkout-btn"
                    className="btn-primary w-full flex items-center justify-between px-6 py-4 text-base"
                >
                    <span>{items.reduce((s, i) => s + i.quantity, 0)} items</span>
                    <span>Proceed to Checkout →</span>
                    <span>₹{grandTotal}</span>
                </Link>
            </div>
        </div>
    )
}
