import { PrismaClient, RoomType } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@hotel.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345";

  // ---- Admin user ----
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: {},
    create: {
      firstname: "Hotel",
      lastname: "Admin",
      email: adminEmail.toLowerCase(),
      password: passwordHash,
      role: "admin",
    },
  });
  console.log(`✅ Admin ready: ${admin.email}`);

  // ---- A demo guest user ----
  const guestHash = await bcrypt.hash("User12345", 10);
  const guest = await prisma.user.upsert({
    where: { email: "guest@hotel.local" },
    update: {},
    create: {
      firstname: "Demo",
      lastname: "Guest",
      email: "guest@hotel.local",
      password: guestHash,
      role: "user",
    },
  });
  console.log(`✅ Guest ready: ${guest.email}`);

  // ---- Sample rooms ----
  const rooms: Array<{
    roomNumber: number;
    type: RoomType;
    floor: number;
    roomRate: number;
    size: string;
    imagelink: string;
  }> = [
    { roomNumber: 101, type: "Single", floor: 1, roomRate: 1200, size: "24 sqm", imagelink: "/singlebed.jpg" },
    { roomNumber: 102, type: "Single", floor: 1, roomRate: 1200, size: "24 sqm", imagelink: "/singlebed.jpg" },
    { roomNumber: 201, type: "Double", floor: 2, roomRate: 2000, size: "32 sqm", imagelink: "/doubleroom.jpg" },
    { roomNumber: 202, type: "Double", floor: 2, roomRate: 2000, size: "32 sqm", imagelink: "/doubleroom.jpg" },
    { roomNumber: 301, type: "Twin", floor: 3, roomRate: 2400, size: "36 sqm", imagelink: "/bed.svg" },
    { roomNumber: 302, type: "Twin", floor: 3, roomRate: 2400, size: "36 sqm", imagelink: "/bed.svg" },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { roomNumber: room.roomNumber },
      update: {},
      create: {
        ...room,
        status: "Available",
        notes: "Seeded room",
        additional1: "Free Wi-Fi",
        additional2: "Air conditioning",
        additional3: "Breakfast included",
      },
    });
  }
  console.log(`✅ Seeded ${rooms.length} rooms`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
