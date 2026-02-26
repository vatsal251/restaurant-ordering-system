import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const r = await prisma.restaurant.findUnique({ where: { id: 'cmlz564650001105a0xv5ra4f' } });
    console.log(r);
}

main().finally(() => prisma.$disconnect());
