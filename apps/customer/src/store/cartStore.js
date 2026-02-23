import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Cart store — persisted per restaurant
// Each item: { id, name, price, quantity, restaurantId, restaurantName }
export const useCartStore = create()(
    persist(
        (set, get) => ({
            items: [],
            restaurantId: null,
            restaurantName: '',

            // Add item — clears cart if from a different restaurant
            addItem: (item) => {
                const { items, restaurantId } = get()
                if (restaurantId && restaurantId !== item.restaurantId) {
                    // Different restaurant — reset cart
                    set({
                        items: [{ ...item, quantity: 1 }],
                        restaurantId: item.restaurantId,
                        restaurantName: item.restaurantName,
                    })
                    return { switched: true }
                }
                const existing = items.find(i => i.id === item.id)
                if (existing) {
                    set({ items: items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) })
                } else {
                    set({
                        items: [...items, { ...item, quantity: 1 }],
                        restaurantId: item.restaurantId,
                        restaurantName: item.restaurantName,
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

            clearCart: () => set({ items: [], restaurantId: null, restaurantName: '' }),

            // Computed
            totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
            totalPrice: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
        }),
        { name: 'cart-storage' }
    )
)
