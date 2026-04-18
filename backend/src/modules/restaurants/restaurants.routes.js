import { Router } from 'express'
import { authenticate, requireRole } from '../../core/middlewares/auth.js'
import * as rc from './restaurants.controller.js'

const router = Router()

// Protected owner routes
router.get('/me/menu', authenticate, requireRole('restaurant_owner'), rc.getOwnerMenu)
router.post('/me/menu', authenticate, requireRole('restaurant_owner'), rc.createOwnerMenu)
router.put('/me/menu/:itemId', authenticate, requireRole('restaurant_owner'), rc.updateOwnerMenu)
router.delete('/me/menu/:itemId', authenticate, requireRole('restaurant_owner'), rc.deleteOwnerMenu)

// Add-ons
router.get('/me/addons', authenticate, requireRole('restaurant_owner'), rc.getOwnerAddons)
router.post('/me/addons', authenticate, requireRole('restaurant_owner'), rc.createOwnerAddon)
router.delete('/me/addons/:addonId', authenticate, requireRole('restaurant_owner'), rc.removeOwnerAddon)

// Inventory
router.patch('/me/inventory', authenticate, requireRole('restaurant_owner'), rc.updateOwnerInventory)
router.get('/me/inventory/logs', authenticate, requireRole('restaurant_owner'), rc.getOwnerInventoryLogs)

router.get('/me/profile', authenticate, requireRole('restaurant_owner'), rc.getOwnerProfile)
router.patch('/me/profile', authenticate, requireRole('restaurant_owner'), rc.updateOwnerProfile)
// Analytics & Marketing
router.get('/me/analytics', authenticate, requireRole('restaurant_owner'), rc.getOwnerAnalytics)
router.get('/me/campaigns', authenticate, requireRole('restaurant_owner'), rc.getOwnerCampaigns)
router.post('/me/campaigns', authenticate, requireRole('restaurant_owner'), rc.createOwnerCampaign)
router.get('/me/promos', authenticate, requireRole('restaurant_owner'), rc.getOwnerPromos)
router.post('/me/promos', authenticate, requireRole('restaurant_owner'), rc.createOwnerPromo)
router.delete('/me/promos/:id', authenticate, requireRole('restaurant_owner'), rc.deleteOwnerPromo)
router.get('/me/reviews', authenticate, requireRole('restaurant_owner'), rc.getOwnerReviews)
router.get('/me/orders', authenticate, requireRole('restaurant_owner'), rc.getOwnerOrders)

// Public routes (Must be after /me/ routes)
router.get('/', rc.getRestaurants)
router.get('/:id', rc.getRestaurantById)
router.get('/:id/menu', rc.getRestaurantMenu)

export default router
