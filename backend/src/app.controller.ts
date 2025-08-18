import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('create-appointment-rooms')
  async createAppointmentRooms(
    @Body()
    body: {
      startTime?: string | number;
      durationMinutes?: number;
      endTime?: string | number;
      appointmentId: number;
    },
  ) {
    // This endpoint will be handled by the Agora controller
    // but we can add business logic here if needed
    return { message: 'Use /agora/create-appointment-rooms endpoint' };
  }
}
