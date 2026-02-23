import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fix() {
    try {
        const users = await prisma.user.findMany({ where: { role: 'restaurant_owner' } })
        console.log(`Checking ${users.length} restaurant owners...`)

        for (const u of users) {
            const r = await prisma.restaurant.findUnique({ where: { ownerId: u.id } })
            if (!r) {
                await prisma.restaurant.create({
                    data: {
                        ownerId: u.id,
                        name: u.name + 's Restaurant',
                        address: 'Pending Address'
                    }
                })
                console.log('Created missing restaurant profile for:', u.email)
            } else {
                console.log('Profile exists for:', u.email)
            }
        }
        console.log('Done fixing profiles!')
    } catch (e) {
        console.error('Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

fix()
