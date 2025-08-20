import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting appointments seed...');

  // Create appointment statuses
  const statuses = await Promise.all([
    prisma.appointmentStatus.upsert({
      where: { name: 'SCHEDULED' },
      update: {},
      create: { name: 'SCHEDULED', description: 'Appointment is scheduled' },
    }),
    prisma.appointmentStatus.upsert({
      where: { name: 'IN_PROGRESS' },
      update: {},
      create: { name: 'IN_PROGRESS', description: 'Appointment is in progress' },
    }),
    prisma.appointmentStatus.upsert({
      where: { name: 'COMPLETED' },
      update: {},
      create: { name: 'COMPLETED', description: 'Appointment is completed' },
    }),
    prisma.appointmentStatus.upsert({
      where: { name: 'CANCELLED' },
      update: {},
      create: { name: 'CANCELLED', description: 'Appointment is cancelled' },
    }),
  ]);

  console.log('✅ Appointment statuses created:', statuses);

  // Create sample appointments
  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        patientId: 1,
        doctorId: 2,
        appointmentDate: new Date('2024-12-20T10:00:00Z'),
        statusId: 1, // SCHEDULED
        notes: 'Regular checkup',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: 1,
        doctorId: 2,
        appointmentDate: new Date('2024-12-21T14:00:00Z'),
        statusId: 1, // SCHEDULED
        notes: 'Follow-up appointment',
      },
    }),
  ]);

  console.log('✅ Sample appointments created:', appointments);

  console.log('🎉 Appointments seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Appointments seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
