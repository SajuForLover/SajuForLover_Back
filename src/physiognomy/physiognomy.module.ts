import { Module } from '@nestjs/common';
import { PhysiognomyService } from './physiognomy.service';
import { PhysiognomyController } from './physiognomy.controller';

@Module({
  controllers: [PhysiognomyController],
  providers: [PhysiognomyService],
})
export class PhysiognomyModule {}
