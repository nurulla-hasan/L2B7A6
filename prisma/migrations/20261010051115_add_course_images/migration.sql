-- AlterEnum
ALTER TYPE "PaymentGateway" ADD VALUE 'BKASH';

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "bkash_payment_id" TEXT,
ALTER COLUMN "gateway" SET DEFAULT 'BKASH';

-- CreateIndex
CREATE INDEX "payments_bkash_payment_id_idx" ON "payments"("bkash_payment_id");
