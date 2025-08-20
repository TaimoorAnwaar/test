import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  try {
    const wantsId = process.env.APPT_ID ? Number(process.env.APPT_ID) : null;
    const statusIdPreferred = 2; // SCHEDULED (from seed-appointment-statuses)

    // Use SCHEDULED if it exists; otherwise insert with NULL status
    const statusRow = await prisma.appointmentStatus.findUnique({ where: { id: statusIdPreferred } }).catch(() => null);
    const statusId = statusRow ? statusIdPreferred : null;

    const data: any = {
      uuid: uuidv4(),
      slotId: null,
      doctorPracticeId: null,
      patientId: null,
      userId: null,
      status: statusId,
      fee: 100,
      discount: 0,
      paymentStatus: 1,
    };

    if (wantsId && Number.isFinite(wantsId)) {
      // MySQL allows explicit IDs; Prisma forwards it. If it fails, fallback to autoincrement.
      try {
        const a = await prisma.appointment.create({ data: { id: BigInt(wantsId), ...data } });
        console.log('✅ Created appointment with explicit id:', a.id.toString());
        return;
      } catch (e) {
        console.warn('⚠️ Explicit id insert failed, falling back to autoincrement. Error:', (e as Error).message);
      }
    }

    const appt = await prisma.appointment.create({ data });
    console.log('✅ Created appointment id:', appt.id.toString(), 'uuid:', appt.uuid);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error('❌ Failed to create appointment:', e); process.exit(1); });


