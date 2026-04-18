import { Router } from 'express'
import { authenticate, requireRole } from '../../core/middlewares/auth.js'
import * as oc from './orders.controller.js'

const router = Router()

// Specific paths first
router.get('/restaurant/pending', authenticate, requireRole('restaurant_owner'), oc.getRestaurantPendingOrders)
router.get('/restaurant/all', authenticate, requireRole('restaurant_owner'), oc.getRestaurantAllOrders)
router.get('/delivery/available', authenticate, requireRole('delivery_partner'), oc.getDeliveryAvailableOrders)
router.post('/verify-payment', authenticate, oc.verifyPayment)
router.post('/validate-promo', authenticate, oc.validatePromo)

// General CRUD
router.post('/', authenticate, requireRole('customer'), oc.placeOrder)
router.get('/', authenticate, oc.getMyOrders)
router.get('/:id', authenticate, oc.getOrderById)
router.patch('/:id/status', authenticate, oc.updateOrderStatus)

// Actions
router.post('/:id/cancel', authenticate, oc.cancelOrder)
router.post('/:id/assign-delivery', authenticate, requireRole('delivery_partner'), oc.assignDelivery)
router.post('/:id/review', authenticate, oc.reviewOrder)

export default router
