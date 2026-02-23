export const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`)

        // Join room by order ID (customers tracking)
        socket.on('JOIN_ORDER_ROOM', ({ orderId }) => {
            socket.join(`order:${orderId}`)
            console.log(`Socket ${socket.id} joined room order:${orderId}`)
        })

        // Join room by restaurant ID (restaurant owners get live orders)
        socket.on('JOIN_RESTAURANT_ROOM', ({ userId }) => {
            socket.join(`restaurant:${userId}`)
            console.log(`Socket ${socket.id} joined restaurant room for user ${userId}`)
        })

        // Delivery partner streams their GPS location
        socket.on('LOCATION_UPDATE', async ({ orderId, lat, lng }) => {
            // Broadcast to customers tracking this order
            socket.to(`order:${orderId}`).emit('LOCATION_UPDATE', { lat, lng })
        })

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`)
        })
    })
}
