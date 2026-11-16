-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('Single', 'Double', 'Twin');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "imagelink" TEXT NOT NULL DEFAULT '#',
    "detail" TEXT NOT NULL DEFAULT '#',
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "roomNumber" INTEGER NOT NULL,
    "type" "RoomType" NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'Available',
    "floor" INTEGER NOT NULL,
    "roomRate" DOUBLE PRECISION NOT NULL,
    "imagelink" TEXT,
    "notes" TEXT,
    "size" TEXT,
    "additional1" TEXT,
    "additional2" TEXT,
    "additional3" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentGuestId" TEXT,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "confirmationNumber" TEXT NOT NULL,
    "checkInDate" TIMESTAMP(3) NOT NULL,
    "checkOutDate" TIMESTAMP(3) NOT NULL,
    "nights" INTEGER NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "specialRequest" TEXT,
    "roomRate" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_roomNumber_key" ON "rooms"("roomNumber");

-- CreateIndex
CREATE INDEX "rooms_status_idx" ON "rooms"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_confirmationNumber_key" ON "bookings"("confirmationNumber");

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_roomId_idx" ON "bookings"("roomId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_currentGuestId_fkey" FOREIGN KEY ("currentGuestId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
