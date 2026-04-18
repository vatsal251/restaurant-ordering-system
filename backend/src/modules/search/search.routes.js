import { Router } from 'express'
import * as sc from './search.controller.js'

const router = Router()

router.get('/', sc.globalSearch)

export default router
