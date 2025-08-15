import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function hash(password: string) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

async function main() {
  // Ensure basic roles exist
  const ensureRoles = [
    { id: 6, type_name: 'Doctor' },
    { id: 10, type_name: 'Simple User' },
  ];
  for (const r of ensureRoles) {
    await prisma.userType.upsert({
      where: { id: r.id },
      update: {},
      create: { id: r.id, typeName: r.type_name },
    });
  }

  const users = [
    {
      email: 'doctor@example.com',
      username: 'doctor01',
      password: 'Password@123',
      fullName: 'Dr. John Doe',
      phone: '+15550000001',
      userTypeId: 6, // Doctor
      isActive: true,
      isSystem: false,
      doctorId: 1n,
    },
    {
      email: 'patient@example.com',
      username: 'patient01',
      password: 'Password@123',
      fullName: 'Jane Patient',
      phone: '+15550000002',
      userTypeId: 10, // Simple User (patient)
      isActive: true,
      isSystem: false,
      doctorId: null,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        username: u.username,
        passwordHash: hash(u.password),
        fullName: u.fullName,
        phone: u.phone,
        phoneVerified: false,
        userTypeId: u.userTypeId,
        isActive: u.isActive,
        isSystem: u.isSystem,
        doctorId: u.doctorId as any,
      },
    });
  }
}

main()
  .catch(async (e) => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });


