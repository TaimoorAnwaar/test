import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const data = [
    { id: 1, type_name: 'Administrator', created_at: new Date('2018-01-19 14:26:45') },
    { id: 2, type_name: 'Moderator - Notification', created_at: new Date('2018-01-19 14:26:45') },
    { id: 3, type_name: 'Moderator - Appointments', created_at: new Date('2018-01-19 14:26:45') },
    { id: 4, type_name: 'Moderator - Doctors', created_at: new Date('2018-01-19 14:26:45') },
    { id: 5, type_name: 'Moderator - Forum', created_at: new Date('2018-01-19 14:26:45') },
    { id: 6, type_name: 'Doctor', created_at: new Date('2018-01-19 14:26:45') },
    { id: 7, type_name: 'Doctor Assistant', created_at: new Date('2018-01-19 14:26:45') },
    { id: 8, type_name: 'Hospital Assistant', created_at: new Date('2018-01-19 14:26:45') },
    { id: 9, type_name: 'Hospital Admin', created_at: new Date('2018-01-19 14:26:45') },
    { id: 10, type_name: 'Simple User', created_at: new Date('2018-01-19 14:26:45') },
    { id: 11, type_name: 'Billing Admin', created_at: new Date('2018-11-28 12:36:54') },
    { id: 12, type_name: 'Moderator - Content', created_at: new Date('2019-02-20 10:36:55') },
    { id: 13, type_name: 'Super User', created_at: new Date('2019-07-10 12:24:45') },
    { id: 14, type_name: 'Moderator - Hospital', created_at: new Date('2019-07-10 12:19:52') },
    { id: 15, type_name: 'Billing Agent (Unrestricted)', created_at: new Date('2019-12-12 12:51:03') },
    { id: 16, type_name: 'Employer', created_at: new Date('2020-03-13 19:03:57') },
    { id: 17, type_name: 'Employee', created_at: new Date('2020-03-13 19:04:12') },
    { id: 18, type_name: 'Callcenter Agent - Appts', created_at: new Date('2020-03-13 19:04:15') },
    { id: 19, type_name: 'Callcenter Agent - OC', created_at: new Date('2020-08-17 16:30:41') },
    { id: 20, type_name: 'DevTeam- QA', created_at: new Date('2020-09-21 13:09:07') },
    { id: 21, type_name: 'Doctors Team', created_at: new Date('2020-10-02 13:33:08') },
    { id: 22, type_name: 'Partnerships Team', created_at: new Date('2020-12-18 18:15:53') },
    { id: 23, type_name: 'Doctors Data Correction Team', created_at: new Date('2021-08-06 12:29:30') },
    { id: 24, type_name: 'Billing Agent (Restricted)', created_at: new Date('2021-08-30 12:16:40') },
    { id: 25, type_name: 'Call Center - QA', created_at: new Date('2021-11-05 21:55:01') },
    { id: 26, type_name: 'Corporate Team', created_at: new Date('2021-12-03 10:06:05') },
    { id: 27, type_name: 'Kuickpay User', created_at: new Date('2022-03-31 23:30:50') },
    { id: 28, type_name: 'Marketing Team', created_at: new Date('2022-07-07 18:19:57'), updated_at: new Date('2022-07-07 18:19:57') },
  ];

  for (const row of data) {
    await prisma.userType.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        typeName: row.type_name,
        createdAt: row.created_at,
        updatedAt: (row as any).updated_at ?? null,
        deletedAt: null,
      },
    });
  }
}

main()
  .catch(async (e) => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });


