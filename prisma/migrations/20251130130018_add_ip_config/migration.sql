-- CreateEnum
CREATE TYPE "IPType" AS ENUM ('SINGLE', 'RANGE');

-- CreateTable
CREATE TABLE "allowed_ips" (
    "id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "type" "IPType" NOT NULL DEFAULT 'SINGLE',
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allowed_ips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ip_config" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT NOT NULL DEFAULT 'Bạn chỉ có thể điểm danh khi sử dụng wifi của trường',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ip_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "allowed_ips_is_active_idx" ON "allowed_ips"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "allowed_ips_ip_address_key" ON "allowed_ips"("ip_address");
