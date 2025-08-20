import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting doctor practices seed...');

  // Create sample doctor practices
  const practices = await Promise.all([
    prisma.doctorPractice.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'General Medical Practice',
        address: '123 Main Street, City, State 12345',
        phone: '+1-555-0123',
        email: 'contact@generalpractice.com',
        specialization: 'General Medicine',
        doctorId: 2, // Assuming doctor with ID 2 exists
      },
    }),
    prisma.doctorPractice.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Cardiology Center',
        address: '456 Heart Avenue, City, State 12345',
        phone: '+1-555-0456',
        email: 'info@cardiologycenter.com',
        specialization: 'Cardiology',
        doctorId: 2, // Assuming doctor with ID 2 exists
      },
    }),
  ]);

  console.log('✅ Doctor practices created:', practices);

  console.log('🎉 Doctor practices seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Doctor practices seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
