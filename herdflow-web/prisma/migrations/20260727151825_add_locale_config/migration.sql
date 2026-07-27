-- CreateTable
CREATE TABLE "LocaleConfig" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-ZA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocaleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocaleConfig_farmerId_key" ON "LocaleConfig"("farmerId");
