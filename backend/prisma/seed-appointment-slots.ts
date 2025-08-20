import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting appointment slots seed...');

  // Create appointment slots for the next 7 days
  const startDate = new Date();
  startDate.setHours(9, 0, 0, 0); // Start at 9 AM

  const slots = [];
  
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      continue;
    }
    
    // Create slots from 9 AM to 5 PM, 30 minutes each
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(currentDate);
        slotTime.setHours(hour, minute, 0, 0);
        
        slots.push({
          startTime: slotTime,
          endTime: new Date(slotTime.getTime() + 30 * 60 * 1000), // 30 minutes later
          isAvailable: true,
          doctorId: 2, // Assuming doctor with ID 2 exists
        });
      }
    }
  }

  // Create the slots in the database
  const createdSlots = await Promise.all(
    slots.map(slot =>
      prisma.appointmentSlot.create({
        data: {
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable,
          doctorId: slot.doctorId,
        },
      })
    )
  );

  console.log('✅ Appointment slots created:', createdSlots.length);

  console.log('🎉 Appointment slots seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Appointment slots seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
