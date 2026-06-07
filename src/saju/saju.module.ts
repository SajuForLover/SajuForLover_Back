import { Module } from '@nestjs/common';
import { SajuService } from './saju.service';
import { SajuController } from './saju.controller';
import { Saju } from './entities/saju.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Saju]), TypeOrmModule.forFeature([User])],  
  controllers: [SajuController],
  providers: [SajuService],
})
export class SajuModule {}
