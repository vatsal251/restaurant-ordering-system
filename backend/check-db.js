import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('Users:', await prisma.user.count());
    console.log('Restaurants:', await prisma.restaurant.count());
    console.log('MenuItems:', await prisma.menuItem.count());
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
