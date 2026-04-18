import { Router } from 'express'
import { authenticate } from '../../core/middlewares/auth.js'
import * as ac from './addresses.controller.js'

const router = Router()

router.use(authenticate)
router.get('/', ac.getAddresses)
router.post('/', ac.createAddress)
router.delete('/:id', ac.deleteAddress)

export default router
