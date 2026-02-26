import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seed() {
    try {
        console.log('Seeding test data...')

        // Use a default password
        const passwordHash = await bcrypt.hash('password123', 10)

        // 1. Create a Customer
        const customer = await prisma.user.create({
            data: {
                name: 'Test Customer',
                email: 'customer@test.com',
                role: 'customer',
                passwordHash
            }
        })
        console.log('✅ Created Customer:', customer.email)

        // 2. Create a Restaurant Owner
        const owner = await prisma.user.create({
            data: {
                name: 'Test Owner',
                email: 'owner@test.com',
                role: 'restaurant_owner',
                passwordHash
            }
        })
        console.log('✅ Created Owner:', owner.email)

        // 3. Create a Restaurant for the Owner
        const restaurant = await prisma.restaurant.create({
            data: {
                ownerId: owner.id,
                name: 'FoodRush Express',
                address: '123 Main Street, Food City',
                cuisineType: 'Italian & Fast Food',
                rating: 4.5,
                isOpen: true,
                isApproved: true,
                imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80'
            }
        })
        console.log('✅ Created Restaurant:', restaurant.name)

        // 4. Create Menu Items
        await prisma.menuItem.createMany({
            data: [
                {
                    restaurantId: restaurant.id,
                    name: 'Margherita Pizza',
                    description: 'Classic cheese pizza with fresh tomatoes and basil',
                    price: 299,
                    category: 'Main Course',
                    isAvailable: true,
                    isVeg: true
                },
                {
                    restaurantId: restaurant.id,
                    name: 'Chicken Burger',
                    description: 'Crispy fried chicken patty with mayo and lettuce',
                    price: 199,
                    category: 'Fast Food',
                    isAvailable: true,
                    isVeg: false
                },
                {
                    restaurantId: restaurant.id,
                    name: 'Paneer Tikka Roll',
                    description: 'Spicy grilled paneer wrapped in a paratha',
                    price: 149,
                    category: 'Rolls',
                    isAvailable: true,
                    isVeg: true
                },
                {
                    restaurantId: restaurant.id,
                    name: 'Chocolate Brownie',
                    description: 'Warm fudge brownie with a gooey center',
                    price: 99,
                    category: 'Desserts',
                    isAvailable: true,
                    isVeg: true
                }
            ]
        })
        console.log('✅ Created 4 Menu Items')

        console.log('\n🎉 Database Seeded Successfully!')
        console.log('You can login with:')
        console.log('Restaurant App -> Email: owner@test.com | Password: password123')
        console.log('Customer App   -> Email: customer@test.com | Password: password123')
    } catch (e) {
        console.error('Seeding failed:', e)
    } finally {
        await prisma.$disconnect()
    }
}

seed()
