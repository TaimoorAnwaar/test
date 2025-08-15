import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rows = [
    { id: 1,  statusKey: 'IN_PROCESS',            title: 'In Process',                    description: 'Appointment is in process' },
    { id: 2,  statusKey: 'SCHEDULED',             title: 'Scheduled',                     description: 'Appointment is scheduled' },
    { id: 3,  statusKey: 'CANCELLED',             title: 'Cancelled',                     description: 'Appointment is cancelled' },
    { id: 4,  statusKey: 'DOCTOR_NOT_RESPONDING', title: 'Doctor Not Responding',         description: 'Doctor is not responding' },
    { id: 5,  statusKey: 'DATA_INCORRECT',        title: 'Data Incorrect',                description: 'Incorrect appointment data' },
    { id: 6,  statusKey: 'DOCTOR_NOT_AVAILABLE',  title: 'Doctor Not Available',          description: 'Doctor is not available' },
    { id: 7,  statusKey: 'INQUIRY',               title: 'Inquiry',                        description: 'General inquiry appointment' },
    { id: 8,  statusKey: 'SHOWED_UP',             title: 'Showed up',                      description: 'Patient showed up' },
    { id: 9,  statusKey: 'OTHER',                 title: 'Other',                          description: 'Other reason' },
    { id: 10, statusKey: 'PATIENT_NO_SHOW',       title: 'Patient - Not Showed up',        description: 'Patient did not show up' },
    { id: 11, statusKey: 'PATIENT_NOT_RESPONDING',title: 'Patient Not Responding',         description: 'Patient is not responding' },
    { id: 12, statusKey: 'DOCTOR_NO_SHOW',        title: 'Doctor - Not Showed Up',         description: 'Doctor did not show up' },
    { id: 13, statusKey: 'CASE_DECLINED',         title: 'Case Declined',                  description: 'Case was declined' },
    { id: 14, statusKey: 'DOCTOR_NO_SHOW_ALT',    title: 'Not Showed-up By Doctor',        description: 'Doctor did not show up' },
    { id: 15, statusKey: 'POWERED_OFF',           title: 'Powered Off',                    description: 'Doctor device powered off' },
    { id: 16, statusKey: 'NO_SHOW_BILLING',       title: 'Not Showed up-Billing',          description: 'Patient did not show up due to billing issue' },
    { id: 17, statusKey: 'DUPLICATE',             title: 'Duplicate',                      description: 'Duplicate appointment entry' },
    { id: 18, statusKey: 'CANCELLED_BY_DOCTOR',   title: 'Cancelled Request By Doctor',    description: 'Doctor cancelled the request' },
  ];

  for (const r of rows) {
    await prisma.appointmentStatus.upsert({
      where: { id: r.id },
      update: {
        title: r.title,
        statusKey: r.statusKey,
        description: r.description,
        isActive: true,
      },
      create: {
        id: r.id,
        title: r.title,
        statusKey: r.statusKey,
        description: r.description,
        isActive: true,
      },
    });
  }
}

main()
  .catch(async (e) => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });


