import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Unschedule all 3 pg_cron jobs
  const result = await prisma.$executeRaw`
    SELECT cron.unschedule(jobid) FROM cron.job 
    WHERE jobname IN (
      'idx_paymenttransaction_updatedat_1',
      'idx_checkoutevent_paymentid_1',
      'idx_checkoutevent_eventtype_createdat_1'
    )
  `;
  console.log(`Unscheduled pg_cron jobs: ${result} row(s) affected`);

  // Verify no more jobs
  const jobs = await prisma.$queryRaw<{ jobname: string }[]>`
    SELECT jobname FROM cron.job 
    WHERE jobname LIKE 'idx_%'
  `;
  console.log(`Remaining idx_ jobs: ${jobs.length}`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
