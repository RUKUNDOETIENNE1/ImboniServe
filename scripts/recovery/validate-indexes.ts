import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check the 3 concurrent indexes
  const indexes = await prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname IN (
      'PaymentTransaction_updatedAt_idx',
      'CheckoutEvent_paymentId_idx',
      'CheckoutEvent_eventType_createdAt_idx'
    )
    ORDER BY indexname
  `;
  console.log(`CONCURRENT INDEXES (${indexes.length}/3):`);
  indexes.forEach(i => console.log(`  - ${i.indexname}`));

  // Check pg_cron jobs
  const jobs = await prisma.$queryRaw<{ jobid: bigint; jobname: string; schedule: string }[]>`
    SELECT jobid, jobname, schedule FROM cron.job ORDER BY jobname
  `;
  console.log(`\nPG_CRON JOBS (${jobs.length}):`);
  jobs.forEach(j => console.log(`  - ${j.jobid}: ${j.jobname} [${j.schedule}]`));

  // Check pg_cron job run results
  const runResults = await prisma.$queryRaw<{ jobid: bigint; status: string; return_message: string }[]>`
    SELECT jobid, status, return_message FROM cron.job_run_details 
    ORDER BY end_time DESC LIMIT 10
  `;
  console.log(`\nPG_CRON RUN RESULTS (${runResults.length}):`);
  runResults.forEach(r => console.log(`  - job ${r.jobid}: ${r.status} - ${r.return_message}`));

  // Check pg_cron extension
  const ext = await prisma.$queryRaw<{ extname: string }[]>`
    SELECT extname FROM pg_extension WHERE extname = 'pg_cron'
  `;
  console.log(`\npg_cron extension: ${ext.length > 0 ? 'INSTALLED' : 'MISSING'}`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
