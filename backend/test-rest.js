import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
    try {
        const r = await prisma.restaurant.findMany({
            select: {
                id: true,
                name: true,
                isOpen: true,
                _count: { select: { menuItems: true } }
            }
        })
        console.log(JSON.stringify(r, null, 2))
    } catch (e) {
        console.error('Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

check()
