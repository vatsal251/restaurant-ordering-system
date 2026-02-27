import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    await prisma.restaurant.updateMany({
        where: { name: 'yo yo' },
        data: { imageUrl: 'http://localhost:3000/uploads/1772138831970-87126281.jpeg' }
    })
    console.log('Updated yo yo')
}
main().catch(console.error).finally(() => prisma.$disconnect())
