import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting test seed...');

  // Create test user types if they don't exist
  const doctorType = await prisma.userType.upsert({
    where: { id: 6 },
    update: {},
    create: {
      id: 6,
      typeName: 'doctor',
    },
  });

  const patientType = await prisma.userType.upsert({
    where: { id: 10 },
    update: {},
    create: {
      id: 10,
      typeName: 'patient',
    },
  });

  console.log('✅ User types created:', { doctorType, patientType });

  // Create a test appointment
  const testAppointment = await prisma.appointment.create({
    data: {
      uuid: 'test-appointment-123',
      status: 1, // Assuming 1 is active status
      fee: 100,
      paymentStatus: 1, // Assuming 1 is paid
    },
  });

  console.log('✅ Test appointment created:', testAppointment);

  // Create test rooms for the appointment
  const now = Date.now();
  const startTime = now + 5 * 60 * 1000; // 5 minutes from now
  const endTime = startTime + 60 * 60 * 1000; // 1 hour duration

  const doctorRoom = await prisma.room.create({
    data: {
      roomId: 'test-doctor-room',
      startTimeMs: BigInt(startTime),
      endTimeMs: BigInt(endTime),
      link: `http://localhost:3001/lobby/test-doctor-room`,
      createdAt: BigInt(now),
      appointmentId: BigInt(testAppointment.id),
      userTypeId: 6, // doctor
    },
  });

  const patientRoom = await prisma.room.create({
    data: {
      roomId: 'test-patient-room',
      startTimeMs: BigInt(startTime),
      endTimeMs: BigInt(endTime),
      link: `http://localhost:3001/lobby/test-patient-room`,
      createdAt: BigInt(now),
      appointmentId: BigInt(testAppointment.id),
      userTypeId: 10, // patient
    },
  });

  console.log('✅ Test rooms created:', { doctorRoom, patientRoom });

  console.log('🎯 Test data summary:');
  console.log(`- Appointment ID: ${testAppointment.id}`);
  console.log(`- Doctor Room: ${doctorRoom.roomId} (${doctorRoom.link})`);
  console.log(`- Patient Room: ${patientRoom.roomId} (${patientRoom.link})`);
  console.log(`- Meeting starts in: ${Math.floor((startTime - now) / 1000 / 60)} minutes`);
  console.log(`- Meeting duration: 1 hour`);

  console.log('✅ Test seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during test seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
