import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { email: true, roles: true } });
  users.forEach(u => console.log(`${u.email}: ${u.roles.join(', ')}`));
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
