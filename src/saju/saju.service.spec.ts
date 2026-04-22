import { Test, TestingModule } from '@nestjs/testing';
import { SajuService } from './saju.service';

describe('SajuService', () => {
  let service: SajuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SajuService],
    }).compile();

    service = module.get<SajuService>(SajuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
