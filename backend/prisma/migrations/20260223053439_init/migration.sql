-- CreateEnum
CREATE TYPE "Role" AS ENUM ('customer', 'delivery_partner', 'restaurant_owner', 'admin');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('placed', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "SealVerdict" AS ENUM ('intact', 'suspicious', 'tampered');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "cuisineType" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.0,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "imageUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "deliveryPartnerId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'placed',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "deliveryAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_tracking" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seal_verifications" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "dispatchPhotoUrl" TEXT,
    "pickupPhotoUrl" TEXT,
    "customerPhotoUrl" TEXT,
    "customerVerdict" "SealVerdict",
    "disputeRaised" BOOLEAN NOT NULL DEFAULT false,
    "resolvedByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seal_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_ownerId_key" ON "restaurants"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "seal_verifications_orderId_key" ON "seal_verifications"("orderId");

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_deliveryPartnerId_fkey" FOREIGN KEY ("deliveryPartnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_tracking" ADD CONSTRAINT "delivery_tracking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seal_verifications" ADD CONSTRAINT "seal_verifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
