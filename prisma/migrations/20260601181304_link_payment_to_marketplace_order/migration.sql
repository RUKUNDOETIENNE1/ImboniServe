-- AlterTable
ALTER TABLE "PaymentTransaction" ADD COLUMN     "marketplaceOrderId" TEXT;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_marketplaceOrderId_fkey" FOREIGN KEY ("marketplaceOrderId") REFERENCES "MarketplaceOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
