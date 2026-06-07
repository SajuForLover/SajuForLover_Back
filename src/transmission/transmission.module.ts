import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransmissionService } from './transmission.service';
import { TransmissionController } from './transmission.controller';
import { User } from '@/user/entities/user.entity';
import { Saju } from '@/saju/entities/saju.entity';
import { Physiognomy } from '@/physiognomy/entities/physiognomy.entity';
import { Compatibility } from '@/character/entities/compatibility.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Saju, Physiognomy, Compatibility])],
  controllers: [TransmissionController],
  providers: [TransmissionService],
})
export class TransmissionModule {}
