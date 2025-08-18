import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDoctorPractices() {
  console.log('🌱 Seeding doctor practices...');

  const practices = [
    {
      name: 'General Practice Clinic',
      address: '123 Main Street, Downtown, City Center',
      phone: '+1-555-0101',
      email: 'info@gpclinic.com',
      isActive: true,
    },
    {
      name: 'Specialist Medical Center',
      address: '456 Oak Avenue, Medical District, City',
      phone: '+1-555-0102',
      email: 'contact@specialistmed.com',
      isActive: true,
    },
    {
      name: 'Family Care Associates',
      address: '789 Pine Street, Suburban Area, City',
      phone: '+1-555-0103',
      email: 'hello@familycare.com',
      isActive: true,
    },
    {
      name: 'Urgent Care Plus',
      address: '321 Elm Road, Shopping Center, City',
      phone: '+1-555-0104',
      email: 'urgent@careplus.com',
      isActive: true,
    },
    {
      name: 'Pediatric Wellness Center',
      address: '654 Maple Drive, Family District, City',
      phone: '+1-555-0105',
      email: 'care@pediatricwellness.com',
      isActive: true,
    },
    {
      name: 'Internal Medicine Associates',
      address: '987 Cedar Lane, Professional Plaza, City',
      phone: '+1-555-0106',
      email: 'info@internalmed.com',
      isActive: true,
    },
    {
      name: 'Cardiology Specialists',
      address: '147 Birch Street, Medical Complex, City',
      phone: '+1-555-0107',
      email: 'heart@cardiospecialists.com',
      isActive: true,
    },
    {
      name: 'Orthopedic Care Center',
      address: '258 Spruce Avenue, Health District, City',
      phone: '+1-555-0108',
      email: 'bones@orthocare.com',
      isActive: true,
    },
    {
      name: 'Dermatology Clinic',
      address: '369 Willow Way, Beauty District, City',
      phone: '+1-555-0109',
      email: 'skin@dermclinic.com',
      isActive: true,
    },
    {
      name: 'Mental Health Associates',
      address: '741 Aspen Court, Wellness District, City',
      phone: '+1-555-0110',
      email: 'care@mentalhealth.com',
      isActive: true,
    },
  ];

  try {
    // Clear existing practices first
    await prisma.doctorPractice.deleteMany({});
    
    // Create new practices
    for (const practice of practices) {
      await prisma.doctorPractice.create({
        data: practice,
      });
    }

    console.log('✅ Doctor practices seeded successfully!');
    console.log(`📊 Created ${practices.length} doctor practices`);
  } catch (error) {
    console.error('❌ Error seeding doctor practices:', error);
    throw error;
  }
}

export { seedDoctorPractices };
