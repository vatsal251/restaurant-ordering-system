import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const r = await prisma.restaurant.findFirst({ where: { name: 'yo yo' } })
    console.log(r)
}
main().catch(console.error).finally(() => prisma.$disconnect())
