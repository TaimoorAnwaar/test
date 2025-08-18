import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgoraModule } from './agora/agora.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AgoraModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
