import { Module } from '@nestjs/common';
import { SajuService } from './saju.service';
import { SajuController } from './saju.controller';

@Module({
  controllers: [SajuController],
  providers: [SajuService],
})
export class SajuModule {}
