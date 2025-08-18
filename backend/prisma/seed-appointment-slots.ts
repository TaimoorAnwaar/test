import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAppointmentSlots() {
  console.log('🌱 Seeding appointment slots...');

  const slots: Array<{
    startTime: Date;
    endTime: Date;
    isAvailable: boolean;
  }> = [];
  const now = new Date();
  
  // Generate slots for the next 30 days
  for (let day = 0; day < 30; day++) {
    const currentDate = new Date(now);
    currentDate.setDate(now.getDate() + day);
    
    // Skip weekends (Saturday = 6, Sunday = 0)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // Generate slots for each day (9 AM to 5 PM, 30-minute intervals)
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = new Date(currentDate);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 30);
        
        // Randomly make some slots unavailable (20% chance)
        const isAvailable = Math.random() > 0.2;
        
        const slot = {
          startTime,
          endTime,
          isAvailable,
        };
        slots.push(slot);
      }
    }
  }

  try {
    // Clear existing slots first
    await prisma.appointmentSlot.deleteMany({});
    
    // Create new slots in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize);
      await prisma.appointmentSlot.createMany({
        data: batch,
      });
    }

    console.log('✅ Appointment slots seeded successfully!');
    console.log(`📊 Created ${slots.length} appointment slots`);
    console.log(`📅 Slots cover ${Math.ceil(slots.length / 16)} business days`);
    console.log(`⏰ Time range: 9:00 AM - 5:00 PM (30-minute intervals)`);
  } catch (error) {
    console.error('❌ Error seeding appointment slots:', error);
    throw error;
  }
}

export { seedAppointmentSlots };
