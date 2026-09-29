import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get all tables created by the partial 20260601081228 run
  // These are tables that exist but weren't created by migrations 1-10
  const knownPriorTables = new Set([
    'AIUsageLog', 'SiteBuilderSubscription', 'DiscoverySubscription',
    'Account', 'ActivityLog', 'Affiliate', 'AffiliateCommission', 'AuditLog',
    'Branch', 'BusinessFeatureOverride', 'BusinessInsightReport', 'BusinessInvite',
    'BusinessProfile', 'BusinessReview', 'ContentPost', 'CustomDomain', 'Customer',
    'CustomerReferral', 'DiningCredit', 'DisposableEmailDomain', 'FeatureFlag',
    'FeeConfiguration', 'GoodsReceivedNote', 'GoodsReceivedNoteItem',
    'InventoryItem', 'InventoryUpdate', 'InviteCredit', 'Invoice',
    'LoyaltyRule', 'MarketplaceOrder', 'MarketplaceOrderItem', 'MarketplaceProduct',
    'MediaAsset', 'MenuItem', 'MenuItemCandidate', 'MenuItemTranslation',
    'MenuSourceDocument', 'Outlet', 'Plan', 'PlatformFeeConfig', 'PlatformMetrics',
    'PointsLedger', 'PostAttribution', 'PostEngagement', 'Promotion',
    'PromotionRedemption', 'PurchaseOrder', 'PurchaseOrderItem',
    'PurchaseOrderStatusHistory', 'ReconciliationLog', 'ReferralLink', 'Reservation',
    'Restaurant', 'Room', 'Sale', 'SaleItem', 'Seat', 'Session',
    'SessionParticipant', 'SlipEditHistory', 'SlipLineItem', 'SlipTemplate',
    'SmartDiningSlip', 'SplitPaymentWhatsAppTrigger', 'StaffRole', 'Subscription',
    'Supplier', 'SupplierDelivery', 'SupplierInsightsSubscription', 'SupplierOrder',
    'SupplierOrderItem', 'SupplierPayout', 'SupplierProduct', 'Table',
    'TableSession', 'TaxConfiguration', 'TrialEligibility', 'User',
    'UserStaffRole', 'VerificationToken', 'WhatsAppMessage', 'WhatsAppTemplate',
    '_prisma_migrations', 'business_scans', 'AffiliateCommissionNew',
    'DiningSessionSlip', 'DiningSessionSlipItem', 'OrderToken', 'ServiceArea',
    'CheckoutEvent', 'StaffTip', 'TipChoice', 'SalePayment',
    'CommissionInvoice', 'AffiliatePayout', 'PostAttribution'
  ]);

  const tables = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  
  const newTables = tables.filter(t => !knownPriorTables.has(t.table_name));
  console.log(`TABLES LIKELY FROM PARTIAL 20260601081228 (${newTables.length}):`);
  newTables.forEach(t => console.log(`  - ${t.table_name}`));

  // Check which indexes/constraints from 20260601081228 already exist
  const fkCount = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT count(*) as count FROM pg_constraint WHERE contype = 'f'
  `;
  console.log(`\nFOREIGN KEYS: ${fkCount[0].count}`);

  const indexCount = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT count(*) as count FROM pg_indexes WHERE schemaname = 'public'
  `;
  console.log(`INDEXES: ${indexCount[0].count}`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
