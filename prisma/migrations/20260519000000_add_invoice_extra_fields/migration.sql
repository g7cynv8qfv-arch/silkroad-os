-- AlterTable: add finance fields to Invoice
ALTER TABLE "Invoice" ADD COLUMN "taxRateBps" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN "paymentTermsDays" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN "notes" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "sentAt" TIMESTAMP(3);
