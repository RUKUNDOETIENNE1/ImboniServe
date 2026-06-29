require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    const r = await prisma.$queryRaw`select 1 as ok`;
    console.log('PRISMA_DB_CHECK: ok', r);
  } catch (e) {
    console.log('PRISMA_DB_CHECK: failed', {
      name: e && e.name,
      code: e && e.code,
      message: String((e && e.message) || e).slice(0, 200)
    });
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
})();
