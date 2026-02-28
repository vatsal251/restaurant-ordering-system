import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Cart store — persisted per restaurant
// Each item: { id, name, price, quantity, restaurantId, restaurantName }
export const useCartStore = create()(
    persist(
        (set, get) => ({
            items: [],

            // Add item — allows items from multiple restaurants
            addItem: (item) => {
                const { items } = get()
                const existing = items.find(i => i.id === item.id)
                if (existing) {
                    set({ items: items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) })
                } else {
                    set({
                        items: [...items, { ...item, quantity: 1 }]
                    })
                }
                return { switched: false }
            },

            removeItem: (id) =>
                set(s => ({ items: s.items.filter(i => i.id !== id) })),

            updateQuantity: (id, quantity) => {
                if (quantity <= 0) {
                    set(s => ({ items: s.items.filter(i => i.id !== id) }))
                } else {
                    set(s => ({ items: s.items.map(i => i.id === id ? { ...i, quantity } : i) }))
                }
            },

            clearCart: () => set({ items: [] }),

            // Computed
            totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
            totalPrice: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
        }),
        { name: 'cart-storage' }
    )
)
