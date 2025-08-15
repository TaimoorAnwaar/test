import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type RoomRecord = {
  roomId: string;
  startTimeMs: number;
  endTimeMs: number;
  link: string;
  createdAt: number;
  appointmentId?: number | null;
};

@Injectable()
export class StorageService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertRoom(record: RoomRecord): Promise<void> {
    await this.prisma.room.upsert({
      where: { roomId: record.roomId },
      update: {
        startTimeMs: BigInt(record.startTimeMs),
        endTimeMs: BigInt(record.endTimeMs),
        link: record.link,
        appointmentId: record.appointmentId != null ? BigInt(record.appointmentId) : null,
      },
      create: {
        roomId: record.roomId,
        startTimeMs: BigInt(record.startTimeMs),
        endTimeMs: BigInt(record.endTimeMs),
        link: record.link,
        createdAt: BigInt(record.createdAt),
        appointmentId: record.appointmentId != null ? BigInt(record.appointmentId) : null,
      },
    });
  }

  async getRoom(roomId: string): Promise<RoomRecord | null> {
    const row = await this.prisma.room.findUnique({ where: { roomId } });
    if (!row) return null;
    return {
      roomId: row.roomId,
      startTimeMs: Number(row.startTimeMs),
      endTimeMs: Number(row.endTimeMs),
      link: row.link,
      createdAt: Number(row.createdAt),
      appointmentId: row.appointmentId != null ? Number(row.appointmentId) : null,
    };
  }
}


