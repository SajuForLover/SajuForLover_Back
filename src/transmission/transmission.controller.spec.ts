import { Test, TestingModule } from '@nestjs/testing';
import { TransmissionController } from './transmission.controller';
import { TransmissionService } from './transmission.service';

describe('TransmissionController', () => {
  let controller: TransmissionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransmissionController],
      providers: [TransmissionService],
    }).compile();

    controller = module.get<TransmissionController>(TransmissionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
