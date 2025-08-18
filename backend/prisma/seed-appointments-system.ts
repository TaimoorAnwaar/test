import { PrismaClient } from '@prisma/client';
import { seedDoctorPractices } from './seed-doctor-practices';
import { seedAppointmentSlots } from './seed-appointment-slots';
import { seedAppointments } from './seed-appointments';

const prisma = new PrismaClient();

async function seedAppointmentsSystem() {
  console.log('🚀 Starting appointments system seeding...\n');

  try {
    // Seed in order: practices -> slots -> appointments
    await seedDoctorPractices();
    console.log('');
    
    await seedAppointmentSlots();
    console.log('');
    
    await seedAppointments();
    console.log('');

    console.log('🎉 Appointments system seeding completed successfully!');
    console.log('📋 Summary:');
    console.log('   ✅ Doctor practices created');
    console.log('   ✅ Appointment slots generated');
    console.log('   ✅ Appointments created with realistic data');
    console.log('   ✅ All relationships established');
    
  } catch (error) {
    console.error('💥 Error during appointments system seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedAppointmentsSystem()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedAppointmentsSystem };
