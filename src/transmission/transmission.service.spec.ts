import { Test, TestingModule } from '@nestjs/testing';
import { TransmissionService } from './transmission.service';

describe('TransmissionService', () => {
  let service: TransmissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransmissionService],
    }).compile();

    service = module.get<TransmissionService>(TransmissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
