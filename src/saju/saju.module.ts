import { Module } from '@nestjs/common';
import { SajuService } from './saju.service';
import { SajuController } from './saju.controller';
import { Saju } from './entities/saju.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Saju])],  
  controllers: [SajuController],
  providers: [SajuService],
})
export class SajuModule {}
