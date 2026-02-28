import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const passwordHash = await bcrypt.hash('123456', 12)

    console.log('Seeding Customers...')
    for (let i = 1; i <= 3; i++) {
        await prisma.user.upsert({
            where: { email: `customer${i}@test.com` },
            update: { passwordHash },
            create: {
                name: `Test Customer ${i}`,
                email: `customer${i}@test.com`,
                role: 'customer',
                passwordHash
            }
        })
    }

    console.log('Seeding Riders...')
    for (let i = 1; i <= 3; i++) {
        await prisma.user.upsert({
            where: { email: `rider${i}@test.com` },
            update: { passwordHash },
            create: {
                name: `Test Rider ${i}`,
                email: `rider${i}@test.com`,
                phone: `+91999999990${i}`,
                role: 'delivery_partner',
                passwordHash,
                isVerified: true
            }
        })
    }

    console.log('Seeding Additional Restaurant Owners...')
    const pizzaOwner = await prisma.user.upsert({
        where: { email: 'pizza.owner@test.com' },
        update: { passwordHash },
        create: {
            name: 'Pizza Owner',
            email: 'pizza.owner@test.com',
            role: 'restaurant_owner',
            passwordHash,
        }
    })

    const burgerOwner = await prisma.user.upsert({
        where: { email: 'burger.owner@test.com' },
        update: { passwordHash },
        create: {
            name: 'Burger Owner',
            email: 'burger.owner@test.com',
            role: 'restaurant_owner',
            passwordHash,
        }
    })

    console.log('Ensuring Additional Restaurants Exist...')
    await prisma.restaurant.upsert({
        where: { id: 'pizza_paradise_id_1' },
        update: { ownerId: pizzaOwner.id },
        create: {
            id: 'pizza_paradise_id_1',
            ownerId: pizzaOwner.id,
            name: 'Pizza Paradise',
            address: '101 Pizza Lane',
            cuisineType: 'Pizza',
            rating: 4.8,
            isOpen: true,
            isApproved: true,
            costForTwo: 600,
            deliveryTime: 25,
            imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80'
        }
    }).catch(() => {
        // Fallback if ID conflict (unlikely, but just in case we rely on name)
        return prisma.restaurant.findFirst({ where: { name: 'Pizza Paradise' } })
    })

    await prisma.restaurant.upsert({
        where: { id: 'burger_joint_id_1' },
        update: { ownerId: burgerOwner.id },
        create: {
            id: 'burger_joint_id_1',
            ownerId: burgerOwner.id,
            name: 'Burger Joint',
            address: '202 Burger Blvd',
            cuisineType: 'Burger, Fast Food',
            rating: 4.5,
            isOpen: true,
            isApproved: true,
            costForTwo: 400,
            deliveryTime: 20,
            imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80'
        }
    }).catch(() => {
        return prisma.restaurant.findFirst({ where: { name: 'Burger Joint' } })
    })

    console.log('Done seeding test accounts.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
