import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
    try {
        const user = await prisma.user.findFirst({ where: { role: 'restaurant_owner' } })
        console.log('User:', user.email)
        const r = await prisma.restaurant.findUnique({ where: { ownerId: user.id } })
        console.log('Restaurant:', r.id)

        await prisma.menuItem.create({
            data: {
                restaurantId: r.id,
                name: 'Pizza',
                price: 500,
                category: 'Main Course'
            }
        })
        console.log('Success')
    } catch (e) {
        console.error('Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

test()
