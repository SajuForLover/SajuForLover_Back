import { Test, TestingModule } from '@nestjs/testing';
import { PhysiognomyService } from './physiognomy.service';

describe('PhysiognomyService', () => {
  let service: PhysiognomyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PhysiognomyService],
    }).compile();

    service = module.get<PhysiognomyService>(PhysiognomyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
