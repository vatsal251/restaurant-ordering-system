import { Router } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { authenticate } from '../../core/middlewares/auth.js'
import { fileURLToPath } from 'url'
import * as sc from './seal.controller.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

const uploadDir = path.join(__dirname, '..', '..', '..', 'uploads')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'seal-' + uniqueSuffix + path.extname(file.originalname))
    }
})

const upload = multer({ storage })

router.post('/:orderId/dispatch', authenticate, upload.single('photo'), sc.dispatchSeal)
router.post('/:orderId/pickup', authenticate, upload.single('photo'), sc.pickupSeal)
router.post('/:orderId/customer', authenticate, upload.single('photo'), sc.customerSeal)
router.get('/:orderId/compare', authenticate, sc.compareSeal)
router.post('/:orderId/dispute', authenticate, sc.disputeSeal)

export default router
