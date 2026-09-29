const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public'
    AND table_name IN ('Business','Restaurant','Supplier','GoodsReceivedNoteItem')
    ORDER BY table_name
  `);
  console.log("Tables found:", rows.map(r => r.table_name));
}
main().catch(e => console.error(e.message)).finally(() => prisma.$disconnect());
