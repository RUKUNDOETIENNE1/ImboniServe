// GPV-D010: Data Migration for Pre-Existing Paid Orders (plain JS version)
const { PrismaClient, BillingEventType, LedgerDomain } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('=== GPV-D010: DATA MIGRATION FOR PRE-EXISTING PAID ORDERS ===\n');

  // Step 1: Find all sales with paymentStatus=COMPLETED but status != 'COMPLETED'
  console.log('--- Step 1: Find sales with inconsistent state ---');
  const inconsistentSales = await p.sale.findMany({
    where: {
      paymentStatus: 'COMPLETED',
      isPaid: true,
      status: { not: 'COMPLETED' },
    },
    select: {
      id: true, orderNumber: true, status: true, paymentStatus: true, isPaid: true,
      totalAmountCents: true, paymentMethod: true, businessId: true, paymentTransactionId: true,
      createdAt: true, updatedAt: true,
    },
  });
  console.log(`Found ${inconsistentSales.length} sales with inconsistent state`);

  if (inconsistentSales.length === 0) {
    console.log('No migration needed — all sales are consistent');
    await p.$disconnect();
    return;
  }

  // Step 2: Fix each sale in a transaction
  console.log('\n--- Step 2: Fix inconsistent sales ---');
  let fixed = 0, ledgerCreated = 0, txnUpdated = 0;

  for (const sale of inconsistentSales) {
    console.log(`\n  Fixing ${sale.orderNumber} (${sale.id}):`);
    console.log(`    Current: status=${sale.status}, paymentStatus=${sale.paymentStatus}, isPaid=${sale.isPaid}`);

    try {
      await p.$transaction(async (tx) => {
        // 2a. Update Sale.status to COMPLETED
        await tx.sale.update({
          where: { id: sale.id },
          data: { status: 'COMPLETED', updatedAt: new Date() },
        });
        console.log(`    ✓ Sale.status set to COMPLETED`);
        fixed++;

        // 2b. Update PaymentTransaction if exists and not already SUCCESS
        if (sale.paymentTransactionId) {
          const txn = await tx.paymentTransaction.findUnique({
            where: { id: sale.paymentTransactionId },
            select: { id: true, status: true, amountCents: true, currency: true, vatAmountCents: true, exVatAmountCents: true, gatewayFeeActualCents: true, gatewayFeeEstimatedCents: true, platformFeeCents: true, netToBusinessCents: true, gateway: true, paymentMethod: true, subscriptionId: true, marketplaceOrderId: true, invoiceNumber: true, referenceId: true, businessId: true },
          });

          if (txn && txn.status !== 'SUCCESS') {
            await tx.paymentTransaction.update({
              where: { id: txn.id },
              data: { status: 'SUCCESS', paidAt: new Date(sale.updatedAt), updatedAt: new Date() },
            });
            console.log(`    ✓ PaymentTransaction.status set to SUCCESS`);
            txnUpdated++;
          } else if (txn) {
            console.log(`    ⊙ PaymentTransaction already SUCCESS — skip`);
          }

          // 2c. Create FinancialLedgerEntry if missing
          if (txn) {
            const existingLedger = await tx.financialLedgerEntry.findFirst({
              where: { paymentTransactionId: txn.id, eventType: BillingEventType.PAYMENT_SUCCESS },
            });

            if (!existingLedger) {
              const domain = txn.marketplaceOrderId ? LedgerDomain.MARKETPLACE : (txn.subscriptionId ? LedgerDomain.SUBSCRIPTION : LedgerDomain.SALES);
              const occurred = new Date(sale.updatedAt);
              const sec = Math.floor(occurred.getTime() / 1000);
              const idempotencyKey = `${txn.id}:${BillingEventType.PAYMENT_SUCCESS}:${sec}:migration`;

              await tx.financialLedgerEntry.create({
                data: {
                  businessId: txn.businessId,
                  domain,
                  eventType: BillingEventType.PAYMENT_SUCCESS,
                  amountCents: txn.amountCents,
                  currency: txn.currency,
                  vatAmountCents: txn.vatAmountCents,
                  exVatAmountCents: txn.exVatAmountCents,
                  gatewayFeeCents: txn.gatewayFeeActualCents ?? txn.gatewayFeeEstimatedCents,
                  platformFeeCents: txn.platformFeeCents,
                  netAmountCents: txn.netToBusinessCents,
                  gateway: txn.gateway,
                  paymentMethod: txn.paymentMethod,
                  status: 'SUCCESS',
                  paymentTransactionId: txn.id,
                  subscriptionId: txn.subscriptionId || undefined,
                  marketplaceOrderId: txn.marketplaceOrderId || undefined,
                  invoiceNumber: txn.invoiceNumber,
                  providerReference: txn.referenceId || undefined,
                  occurredAt: occurred,
                  idempotencyKey,
                },
              });
              console.log(`    ✓ FinancialLedgerEntry created (domain=${domain}, amount=${txn.amountCents})`);
              ledgerCreated++;
            } else {
              console.log(`    ⊙ FinancialLedgerEntry already exists — skip`);
            }
          }
        } else {
          // No PaymentTransaction — create ledger from sale data
          const ledgerCount = await tx.financialLedgerEntry.count({
            where: { businessId: sale.businessId, eventType: BillingEventType.PAYMENT_SUCCESS, amountCents: { gt: 0 } },
          });

          if (ledgerCount === 0) {
            const occurred = new Date(sale.updatedAt);
            const sec = Math.floor(occurred.getTime() / 1000);
            const idempotencyKey = `${sale.businessId}:${sale.id}:PAYMENT_SUCCESS:${sec}:migration`;

            const business = await tx.business.findUnique({
              where: { id: sale.businessId },
              select: { currency: true },
            });

            await tx.financialLedgerEntry.create({
              data: {
                businessId: sale.businessId,
                domain: LedgerDomain.SALES,
                eventType: BillingEventType.PAYMENT_SUCCESS,
                amountCents: sale.totalAmountCents,
                currency: business?.currency || 'RWF',
                gateway: sale.paymentMethod === 'CASH' ? 'CASH' : undefined,
                paymentMethod: sale.paymentMethod,
                status: 'SUCCESS',
                occurredAt: occurred,
                idempotencyKey,
              },
            });
            console.log(`    ✓ FinancialLedgerEntry created from sale data (amount=${sale.totalAmountCents})`);
            ledgerCreated++;
          } else {
            console.log(`    ⊙ Non-zero ledger entries already exist for business — skip`);
          }
        }
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        console.log(`    ⊙ Idempotency key conflict — already migrated`);
      } else {
        console.error(`    ✗ Failed to fix sale: ${error.message}`);
      }
    }
  }

  // Step 3: Clean up 0-amount PLATFORM ledger entries from the old logBillingEvent bug
  console.log('\n--- Step 3: Clean up 0-amount PLATFORM ledger entries ---');
  const zeroAmountEntries = await p.financialLedgerEntry.deleteMany({
    where: {
      domain: LedgerDomain.PLATFORM,
      eventType: BillingEventType.PAYMENT_SUCCESS,
      amountCents: 0,
      paymentTransactionId: null,
    },
  });
  console.log(`Deleted ${zeroAmountEntries.count} 0-amount PLATFORM ledger entries`);

  // Summary
  console.log('\n=== MIGRATION SUMMARY ===');
  console.log(`Sales fixed (status → COMPLETED): ${fixed}`);
  console.log(`PaymentTransactions updated (→ SUCCESS): ${txnUpdated}`);
  console.log(`FinancialLedgerEntries created: ${ledgerCreated}`);
  console.log(`0-amount PLATFORM entries cleaned: ${zeroAmountEntries.count}`);

  await p.$disconnect();
}

main().catch(e => { console.error('Migration error:', e.message); process.exit(1); });
