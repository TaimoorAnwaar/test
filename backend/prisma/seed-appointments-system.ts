import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting appointments system seed...');

  // Create appointment system configuration
  const systemConfig = await prisma.appointmentSystem.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Default Appointment System',
      description: 'Standard appointment booking system',
      isActive: true,
      maxAppointmentsPerDay: 20,
      appointmentDuration: 30, // minutes
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00',
      timezone: 'UTC',
    },
  });

  console.log('✅ Appointment system configuration created:', systemConfig);

  // Create default working days
  const workingDays = await Promise.all([
    prisma.workingDay.upsert({
      where: { id: 1 },
      update: {},
      create: {
        dayOfWeek: 'MONDAY',
        isWorkingDay: true,
        startTime: '09:00',
        endTime: '17:00',
        systemId: 1,
      },
    }),
    prisma.workingDay.upsert({
      where: { id: 2 },
      update: {},
      create: {
        dayOfWeek: 'TUESDAY',
        isWorkingDay: true,
        startTime: '09:00',
        endTime: '17:00',
        systemId: 1,
      },
    }),
    prisma.workingDay.upsert({
      where: { id: 3 },
      update: {},
      create: {
        dayOfWeek: 'WEDNESDAY',
        isWorkingDay: true,
        startTime: '09:00',
        endTime: '17:00',
        systemId: 1,
      },
    }),
    prisma.workingDay.upsert({
      where: { id: 4 },
      update: {},
      create: {
        dayOfWeek: 'THURSDAY',
        isWorkingDay: true,
        startTime: '09:00',
        endTime: '17:00',
        systemId: 1,
      },
    }),
    prisma.workingDay.upsert({
      where: { id: 5 },
      update: {},
      create: {
        dayOfWeek: 'FRIDAY',
        isWorkingDay: true,
        startTime: '09:00',
        endTime: '17:00',
        systemId: 1,
      },
    }),
  ]);

  console.log('✅ Working days created:', workingDays);

  console.log('🎉 Appointments system seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Appointments system seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
