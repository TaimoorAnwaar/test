import { Controller, Get, Query, Post, Body, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AgoraService } from './agora.service';

@Controller('agora')
export class AgoraController {
  constructor(private readonly agora: AgoraService) {}

  @Post('create-appointment-rooms')
  async createAppointmentRooms(
    @Body()
    body: {
      // ISO string or epoch ms
      startTime?: string | number;
      // duration in minutes OR explicit endTime
      durationMinutes?: number;
      endTime?: string | number;
      // appointment ID to link rooms to appointment
      appointmentId: number;
    },
  ) {
    if (!body.appointmentId) {
      throw new BadRequestException('appointmentId is required');
    }

    // If schedule provided, use it; otherwise use default
    const now = Date.now();
    let startTimeMs = now;
    let endTimeMs = now + 60 * 60 * 1000; // default 60 minutes

    if (body) {
      if (typeof body.startTime !== 'undefined') {
        startTimeMs = typeof body.startTime === 'string' ? Date.parse(body.startTime) : Number(body.startTime);
      }
      if (typeof body.endTime !== 'undefined') {
        endTimeMs = typeof body.endTime === 'string' ? Date.parse(body.endTime) : Number(body.endTime);
      } else if (typeof body.durationMinutes === 'number' && body.durationMinutes > 0) {
        endTimeMs = startTimeMs + body.durationMinutes * 60 * 1000;
      }
    }

    if (!Number.isFinite(startTimeMs) || !Number.isFinite(endTimeMs)) {
      throw new BadRequestException('Invalid startTime/endTime');
    }
    if (endTimeMs <= startTimeMs) {
      throw new BadRequestException('endTime must be after startTime');
    }

    // Create separate rooms for doctor and patient
    const rooms = await this.agora.createDoctorAndPatientRooms(startTimeMs, endTimeMs, body.appointmentId);

    return {
      success: true,
      appointmentId: body.appointmentId,
      startTimeMs,
      endTimeMs,
      rooms: {
        doctor: {
          roomId: rooms.doctorRoom.roomId,
          link: rooms.doctorRoom.link,
          userType: 'doctor',
          userTypeId: 6
        },
        patient: {
          roomId: rooms.patientRoom.roomId,
          link: rooms.patientRoom.link,
          userType: 'patient',
          userTypeId: 10
        }
      }
    };
  }

  @Post('create-room')
  async createRoom(
    @Body()
    body: {
      // ISO string or epoch ms
      startTime?: string | number;
      // duration in minutes OR explicit endTime
      durationMinutes?: number;
      endTime?: string | number;
      // usertype: 'doctor' or 'patient'
      usertype: 'doctor' | 'patient';
      // appointment ID to link room to appointment
      appointmentId?: number;
    },
  ) {
    // If schedule provided, persist it
    const now = Date.now();
    let startTimeMs = now;
    let endTimeMs = now + 60 * 60 * 1000; // default 60 minutes

    if (body) {
      if (typeof body.startTime !== 'undefined') {
        startTimeMs = typeof body.startTime === 'string' ? Date.parse(body.startTime) : Number(body.startTime);
      }
      if (typeof body.endTime !== 'undefined') {
        endTimeMs = typeof body.endTime === 'string' ? Date.parse(body.endTime) : Number(body.endTime);
      } else if (typeof body.durationMinutes === 'number' && body.durationMinutes > 0) {
        endTimeMs = startTimeMs + body.durationMinutes * 60 * 1000;
      }
    }

    if (!Number.isFinite(startTimeMs) || !Number.isFinite(endTimeMs)) {
      throw new BadRequestException('Invalid startTime/endTime');
    }
    if (endTimeMs <= startTimeMs) {
      throw new BadRequestException('endTime must be after startTime');
    }

    // Set usertype ID based on the parameter
    const userTypeId = body.usertype === 'doctor' ? 6 : body.usertype === 'patient' ? 10 : 10; // default to patient

    // Create room in database
    const room = await this.agora.createRoom(startTimeMs, endTimeMs, userTypeId, body.appointmentId);

    // Generate URL based on usertype
    const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3001';
    const link = body.usertype === 'doctor' 
      ? `${baseUrl}/lobby/${room.roomId}`
      : `${baseUrl}/lobby/${room.roomId}`;

    // Update the link in the database
    await this.agora.updateRoomLink(room.roomId, link);

    return {
      room: room.roomId,
      link,
      startTimeMs,
      endTimeMs,
      usertype: body.usertype || 'patient',
      userTypeId,
      appointmentId: body.appointmentId || null,
    };
  }

  @Get('token')
  async getToken(@Query('channel') channel: string, @Query('uid') uid: string) {
    console.log('Token request received:', { channel, uid });
    
    if (!channel || !uid) {
      console.error('Missing required parameters:', { channel, uid });
      return { error: 'channel and uid required' };
    }

    // Get room schedule from database
    const schedule = await this.agora.getRoomSchedule(String(channel));
    console.log('Room schedule:', schedule);
    
    if (!schedule) {
      console.error('Room not found for channel:', channel);
      throw new BadRequestException('Room not found');
    }

    const now = Date.now();
    const { startTimeMs, endTimeMs } = schedule;
    
    console.log('Time check:', { now, startTimeMs, endTimeMs, isActive: now >= startTimeMs && now <= endTimeMs });
    
    if (now < startTimeMs) {
      console.error('Meeting not started yet');
      throw new ForbiddenException('meeting_not_started');
    }
    if (now > endTimeMs) {
      console.error('Meeting has ended');
      throw new ForbiddenException('meeting_ended');
    }
    
    // Token expiry at most until meeting end (plus small grace window 2 minutes)
    const expireSeconds = Math.max(60, Math.min(60 * 60 * 4, Math.floor((endTimeMs - now) / 1000) + 120));
    console.log('Generating token with expiry:', expireSeconds);
    
    const token = this.agora.generateToken(channel, uid, 'publisher', expireSeconds);
    
    const response = { 
      token, 
      appId: process.env.AGORA_APP_ID, 
      startTimeMs, 
      endTimeMs,
      userType: schedule.userType,
      appointmentId: schedule.appointmentId
    };
    
    console.log('Token response:', { 
      tokenLength: token.length, 
      appId: response.appId,
      userType: response.userType 
    });
    
    return response;
  }

  @Get('schedule')
  async getSchedule(@Query('channel') channel: string) {
    if (!channel) throw new BadRequestException('channel required');
    
    const schedule = await this.agora.getRoomSchedule(String(channel));
    if (!schedule) {
      return { startTimeMs: null, endTimeMs: null, now: Date.now() };
    }
    
    return { ...schedule, now: Date.now() };
  }

  @Get('rooms-by-appointment')
  async getRoomsByAppointment(@Query('appointmentId') appointmentId: string) {
    if (!appointmentId) throw new BadRequestException('appointmentId required');
    
    const rooms = await this.agora.getRoomsByAppointment(Number(appointmentId));
    return { rooms, appointmentId: Number(appointmentId) };
  }

  @Get('room-status')
  async getRoomStatus(@Query('roomId') roomId: string) {
    if (!roomId) throw new BadRequestException('roomId required');
    
    const isActive = await this.agora.isRoomActive(roomId);
    const schedule = await this.agora.getRoomSchedule(roomId);
    
    return {
      roomId,
      isActive,
      schedule: schedule ? {
        startTimeMs: schedule.startTimeMs,
        endTimeMs: schedule.endTimeMs,
        userType: schedule.userType,
        appointmentId: schedule.appointmentId
      } : null
    };
  }
}