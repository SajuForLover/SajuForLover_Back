import { Test, TestingModule } from '@nestjs/testing';
import { PhysiognomyController } from './physiognomy.controller';
import { PhysiognomyService } from './physiognomy.service';

describe('PhysiognomyController', () => {
  let controller: PhysiognomyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhysiognomyController],
      providers: [PhysiognomyService],
    }).compile();

    controller = module.get<PhysiognomyController>(PhysiognomyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
