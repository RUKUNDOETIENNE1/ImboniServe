import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check PaymentGateway enum values
  const pgValues = await prisma.$queryRaw<{ enumlabel: string }[]>`
    SELECT e.enumlabel FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public' AND t.typname = 'PaymentGateway'
    ORDER BY e.enumsortorder
  `;
  console.log(`PaymentGateway values:`);
  pgValues.forEach(v => console.log(`  - ${v.enumlabel}`));

  // Check if PaymentGateway_old exists
  const oldType = await prisma.$queryRaw<{ typname: string }[]>`
    SELECT t.typname FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public' AND t.typname = 'PaymentGateway_old'
  `;
  console.log(`\nPaymentGateway_old exists: ${oldType.length > 0}`);

  // Check PaymentTransaction table columns
  const columns = await prisma.$queryRaw<{ column_name: string; data_type: string }[]>`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'PaymentTransaction'
    ORDER BY ordinal_position
  `;
  console.log(`\nPaymentTransaction columns (${columns.length}):`);
  columns.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));

  // Check Subscription status column type
  const subStatus = await prisma.$queryRaw<{ column_name: string; udt_name: string }[]>`
    SELECT column_name, udt_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Subscription' AND column_name = 'status'
  `;
  console.log(`\nSubscription.status type: ${subStatus.length > 0 ? subStatus[0].udt_name : 'NOT FOUND'}`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
