-- CreateTable
CREATE TABLE "business_settings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rnc" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "logo" TEXT,
    "slogan" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'República Dominicana',
    "postalCode" TEXT,
    "taxRegime" TEXT NOT NULL DEFAULT 'Régimen Ordinario',
    "economicActivity" TEXT,
    "receiptFooter" TEXT,
    "invoiceTerms" TEXT,
    "warrantyInfo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_settings_pkey" PRIMARY KEY ("id")
);
