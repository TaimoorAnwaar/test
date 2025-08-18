import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedAppointments() {
  console.log('🌱 Seeding appointments...');

  try {
    // Get existing data to create realistic relationships
    const users = await prisma.user.findMany({
      where: { isActive: true },
      take: 20, // Limit to first 20 users
    });

    const practices = await prisma.doctorPractice.findMany({
      where: { isActive: true },
      take: 5, // Use first 5 practices
    });

    const slots = await prisma.appointmentSlot.findMany({
      where: { isAvailable: true },
      take: 50, // Use first 50 available slots
    });

    if (users.length === 0) {
      console.log('⚠️ No users found. Please seed users first.');
      console.log('💡 Run: npm run seed (to seed user types first)');
      return;
    }

    if (practices.length === 0) {
      console.log('⚠️ No doctor practices found. Please seed doctor practices first.');
      console.log('💡 Run: npm run seed:doctor-practices');
      return;
    }

    if (slots.length === 0) {
      console.log('⚠️ No appointment slots found. Please seed appointment slots first.');
      console.log('💡 Run: npm run seed:appointment-slots');
      return;
    }

    const appointments: Array<{
      uuid: string;
      slotId: bigint;
      doctorPracticeId: bigint;
      patientId: bigint;
      userId: bigint;
      status: number;
      fee: number;
      discount: number;
      paymentStatus: number;
    }> = [];
    const appointmentStatuses = [0, 1, 2, 3, 4]; // scheduled, confirmed, in progress, completed, cancelled
    const paymentStatuses = [0, 1, 2]; // pending, paid, partially paid
    const fees = [50, 75, 100, 125, 150, 200, 250, 300]; // Common consultation fees

    // Create appointments for the next 30 days
    for (let i = 0; i < 100; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomPractice = practices[Math.floor(Math.random() * practices.length)];
      const randomSlot = slots[Math.floor(Math.random() * slots.length)];
      
      // Randomly assign patient and user (sometimes same, sometimes different)
      const patientId = randomUser.id;
      const userId = Math.random() > 0.3 ? randomUser.id : users[Math.floor(Math.random() * users.length)].id;
      
      // Random status with weighted distribution
      const status = Math.random() > 0.7 ? appointmentStatuses[Math.floor(Math.random() * appointmentStatuses.length)] : 0;
      
      // Random payment status
      const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      
      // Random fee with discount
      const fee = fees[Math.floor(Math.random() * fees.length)];
      const discount = Math.random() > 0.8 ? Math.floor(Math.random() * 30) : 0; // 20% chance of discount
      
      const appointment = {
        uuid: uuidv4(),
        slotId: randomSlot.id,
        doctorPracticeId: randomPractice.id,
        patientId,
        userId,
        status,
        fee,
        discount,
        paymentStatus,
      };
      appointments.push(appointment);
    }

    // Clear existing appointments first
    await prisma.appointment.deleteMany({});
    
    // Create new appointments in batches for better performance
    const batchSize = 25;
    for (let i = 0; i < appointments.length; i += batchSize) {
      const batch = appointments.slice(i, i + batchSize);
      await prisma.appointment.createMany({
        data: batch,
      });
    }

    // Update slots to mark them as unavailable for booked appointments
    const bookedSlotIds = appointments.map(a => a.slotId).filter(Boolean);
    if (bookedSlotIds.length > 0) {
      await prisma.appointmentSlot.updateMany({
        where: { id: { in: bookedSlotIds } },
        data: { isAvailable: false },
      });
    }

    console.log('✅ Appointments seeded successfully!');
    console.log(`📊 Created ${appointments.length} appointments`);
    console.log(`👥 Using ${users.length} users`);
    console.log(`🏥 Using ${practices.length} doctor practices`);
    console.log(`⏰ Using ${slots.length} appointment slots`);
    console.log(`🔒 Updated ${bookedSlotIds.length} slots to unavailable`);
    
    // Show status distribution
    const statusCounts = appointments.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    console.log('📈 Appointment Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const statusNames = ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];
      console.log(`   ${statusNames[status] || 'Unknown'}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error seeding appointments:', error);
    throw error;
  }
}

export { seedAppointments };
