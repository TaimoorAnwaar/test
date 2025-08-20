import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting test seed...');

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      userType: 'PATIENT',
    },
  });

  console.log('✅ Test user created:', testUser);

  // Create test doctor
  const testDoctor = await prisma.user.upsert({
    where: { email: 'doctor@example.com' },
    update: {},
    create: {
      email: 'doctor@example.com',
      name: 'Test Doctor',
      userType: 'DOCTOR',
    },
  });

  console.log('✅ Test doctor created:', testDoctor);

  console.log('🎉 Test seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Test seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
