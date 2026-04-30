import { Module } from '@nestjs/common';
import { PhysiognomyService } from './physiognomy.service';
import { PhysiognomyController } from './physiognomy.controller';
import { Physiognomy } from './entities/physiognomy.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Physiognomy]), TypeOrmModule.forFeature([User])],
  controllers: [PhysiognomyController],
  providers: [PhysiognomyService],
})
export class PhysiognomyModule {}
