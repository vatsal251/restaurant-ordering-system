import { Router } from 'express'
import { authenticate } from '../../core/middlewares/auth.js'
import * as gc from './groupOrder.controller.js'

const router = Router()

router.get('/ping', gc.ping)
router.post('/', authenticate, gc.createGroupOrder)
router.get('/:id', gc.getGroupOrder)
router.post('/:id/items', gc.addItem)
router.delete('/:id/items/:itemId', gc.removeItem)
router.post('/:id/lock', authenticate, gc.lockGroupOrder)
router.post('/:id/checkout', authenticate, gc.checkoutGroupOrder)

export default router
