import { Injectable } from '@nestjs/common';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgoraService {
  private appId = process.env.AGORA_APP_ID || '';
  private appCertificate = process.env.AGORA_APP_CERTIFICATE || '';

  constructor(private prisma: PrismaService) {
    // Debug environment variables on service initialization
    console.log('AgoraService initialized with:', {
      appId: this.appId ? 'present' : 'missing',
      appIdValue: this.appId,
      appCertificate: this.appCertificate ? 'present' : 'missing',
      appCertificateLength: this.appCertificate ? this.appCertificate.length : 0,
      allEnvVars: {
        AGORA_APP_ID: process.env.AGORA_APP_ID,
        AGORA_APP_CERTIFICATE: process.env.AGORA_APP_CERTIFICATE ? 'present' : 'missing'
      }
    });
  }

  generateToken(channelName: string, uid: string | number, role: 'publisher' | 'subscriber' = 'publisher', expireSeconds = 3600) {
    console.log('Generating token with:', {
      appId: this.appId ? 'present' : 'missing',
      appCertificate: this.appCertificate ? 'present' : 'missing',
      channelName,
      uid,
      role,
      expireSeconds
    });

    if (!this.appId || !this.appCertificate) {
      console.error('Missing Agora credentials:', {
        appId: this.appId,
        appCertificate: this.appCertificate ? 'present' : 'missing'
      });
      throw new Error('AGORA_APP_ID or AGORA_APP_CERTIFICATE is missing. Set them in backend/.env');
    }

    const roleEnum = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const ts = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = ts + expireSeconds;
    
    console.log('Token generation parameters:', {
      appId: this.appId,
      appCertificateLength: this.appCertificate.length,
      channelName,
      uid: Number(uid),
      roleEnum,
      privilegeExpiredTs
    });

    const token = RtcTokenBuilder.buildTokenWithUid(this.appId, this.appCertificate, channelName, Number(uid), roleEnum, privilegeExpiredTs);
    
    console.log('Token generated successfully, length:', token.length);
    return token;
  }

  async createRoom(startTimeMs: number, endTimeMs: number, userTypeId: number, appointmentId?: number) {
    const roomId = uuidv4().split('-')[0];
    
    // Create room in database
    const room = await this.prisma.room.create({
      data: {
        roomId,
        startTimeMs: BigInt(startTimeMs),
        endTimeMs: BigInt(endTimeMs),
        link: '', // Will be set after creation
        createdAt: BigInt(Date.now()),
        appointmentId: appointmentId ? BigInt(appointmentId) : null,
        userTypeId,
      },
    });

    return room;
  }

  async createDoctorAndPatientRooms(startTimeMs: number, endTimeMs: number, appointmentId: number) {
    // Create a single shared room for both doctor and patient
    const sharedRoom = await this.createRoom(startTimeMs, endTimeMs, 6, appointmentId); // Use doctor type as default

    // Generate different URLs for doctor and patient lobby, but same video call room
    const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3001';
    
    const doctorLink = `${baseUrl}/lobby/${sharedRoom.roomId}?userType=doctor`;
    const patientLink = `${baseUrl}/lobby/${sharedRoom.roomId}?userType=patient`;

    // Update the link in the database (we'll store the base room link)
    await this.prisma.room.update({
      where: { roomId: sharedRoom.roomId },
      data: { link: `${baseUrl}/call/${sharedRoom.roomId}` }
    });

    return {
      doctorRoom: { 
        ...sharedRoom, 
        link: doctorLink,
        userType: 'doctor',
        userTypeId: 6
      },
      patientRoom: { 
        ...sharedRoom, 
        link: patientLink,
        userType: 'patient',
        userTypeId: 10
      },
      sharedRoomId: sharedRoom.roomId
    };
  }

  async getRoomSchedule(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { roomId },
      include: {
        userType: true,
        appointment: true
      }
    });

    if (!room) return null;

    return {
      startTimeMs: Number(room.startTimeMs),
      endTimeMs: Number(room.endTimeMs),
      userTypeId: room.userTypeId,
      userType: room.userType.typeName,
      appointmentId: room.appointmentId ? Number(room.appointmentId) : null,
      link: room.link,
      createdAt: Number(room.createdAt)
    };
  }

  async getRoomsByAppointment(appointmentId: number) {
    const rooms = await this.prisma.room.findMany({
      where: { appointmentId: BigInt(appointmentId) },
      include: {
        userType: true
      }
    });

    return rooms.map(room => ({
      roomId: room.roomId,
      startTimeMs: Number(room.startTimeMs),
      endTimeMs: Number(room.endTimeMs),
      userTypeId: room.userTypeId,
      userType: room.userType.typeName,
      link: room.link,
      createdAt: Number(room.createdAt)
    }));
  }

  async isRoomActive(roomId: string): Promise<boolean> {
    const room = await this.prisma.room.findUnique({
      where: { roomId }
    });

    if (!room) return false;

    const now = Date.now();
    const startTime = Number(room.startTimeMs);
    const endTime = Number(room.endTimeMs);

    return now >= startTime && now <= endTime;
  }

  async updateRoomLink(roomId: string, link: string) {
    return await this.prisma.room.update({
      where: { roomId },
      data: { link }
    });
  }
}