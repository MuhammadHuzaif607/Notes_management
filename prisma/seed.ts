// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.tag.createMany({
    data: [{ name: 'typescript' }, { name: 'nestjs' }, { name: 'prisma' }],
  });
}

main()
  .then(() => console.log('Seeded tags!'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
