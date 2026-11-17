import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@hotel.local").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345";

  const people = [
    { firstName: "Hotel", lastName: "Admin",        email: adminEmail,                 password: adminPassword,      role: "admin"        as const, phone: "0900000001" },
    { firstName: "Mana",  lastName: "Manager",      email: "manager@hotel.local",      password: "Manager12345",     role: "manager"      as const, phone: "0900000002" },
    { firstName: "Fern",  lastName: "Frontdesk",    email: "frontdesk@hotel.local",    password: "Frontdesk12345",   role: "frontdesk"    as const, phone: "0900000003" },
    { firstName: "Hom",   lastName: "Housekeeping", email: "housekeeping@hotel.local", password: "Housekeep12345",    role: "housekeeping" as const, phone: "0900000004" },
    { firstName: "Demo",  lastName: "Customer",     email: "customer@hotel.local",     password: "Customer12345",    role: "customer"     as const, phone: "0900000005" },
  ];

  for (const p of people) {
    const passwordHash = await bcrypt.hash(p.password, 10);
    const u = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
        passwordHash,
        role: p.role,
      },
    });
    console.log(`user: ${u.email} (${u.role})`);
  }

  const roomTypes = [
    {
      slug: "standard",
      name: "Standard Room",
      description: "ห้องมาตรฐาน สะดวกสบายสำหรับการพักผ่อน",
      basePrice: "1200.00",
      maxAdults: 2,
      maxChildren: 1,
      bedType: "1 Queen",
      sizeSqm: 24,
      images: ["/rooms/standard-1.jpg", "/rooms/standard-2.jpg"],
      amenities: ["Free Wi-Fi", "Air conditioning", "Smart TV", "Private bathroom"],
    },
    {
      slug: "deluxe",
      name: "Deluxe Room",
      description: "ห้องดีลักซ์ กว้างขึ้น พร้อมวิวเมือง",
      basePrice: "2200.00",
      maxAdults: 2,
      maxChildren: 2,
      bedType: "1 King",
      sizeSqm: 32,
      images: ["/rooms/deluxe-1.jpg", "/rooms/deluxe-2.jpg"],
      amenities: ["Free Wi-Fi", "Air conditioning", "Smart TV", "Minibar", "City view", "Breakfast included"],
    },
    {
      slug: "suite",
      name: "Executive Suite",
      description: "ห้องสวีท พร้อมห้องนั่งเล่นแยกส่วน",
      basePrice: "4500.00",
      maxAdults: 3,
      maxChildren: 2,
      bedType: "1 King + Sofa bed",
      sizeSqm: 52,
      images: ["/rooms/suite-1.jpg", "/rooms/suite-2.jpg"],
      amenities: ["Free Wi-Fi", "Air conditioning", "Smart TV", "Minibar", "Living area", "Bathtub", "Breakfast included", "Lounge access"],
    },
  ];

  const typeIdBySlug: Record<string, string> = {};
  for (const t of roomTypes) {
    const rt = await prisma.roomType.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
    typeIdBySlug[t.slug] = rt.id;
    console.log(`room type: ${rt.name} (${rt.basePrice} THB)`);
  }

  const rooms = [
    { roomNumber: 101, floor: 1, slug: "standard" },
    { roomNumber: 102, floor: 1, slug: "standard" },
    { roomNumber: 103, floor: 1, slug: "standard" },
    { roomNumber: 201, floor: 2, slug: "standard" },
    { roomNumber: 301, floor: 3, slug: "deluxe" },
    { roomNumber: 302, floor: 3, slug: "deluxe" },
    { roomNumber: 303, floor: 3, slug: "deluxe" },
    { roomNumber: 501, floor: 5, slug: "suite" },
    { roomNumber: 502, floor: 5, slug: "suite" },
  ];

  for (const r of rooms) {
    await prisma.room.upsert({
      where: { roomNumber: r.roomNumber },
      update: {},
      create: {
        roomNumber: r.roomNumber,
        floor: r.floor,
        status: "available",
        roomTypeId: typeIdBySlug[r.slug],
      },
    });
  }
  console.log(`seeded ${rooms.length} rooms across ${roomTypes.length} room types`);

  console.log("\n Login accounts (email / password):");
  console.log(`   admin         → ${adminEmail} / ${adminPassword}`);
  console.log("   manager       → manager@hotel.local / Manager12345");
  console.log("   frontdesk     → frontdesk@hotel.local / Frontdesk12345");
  console.log("   housekeeping  → housekeeping@hotel.local / Housekeep12345");
  console.log("   customer      → customer@hotel.local / Customer12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });