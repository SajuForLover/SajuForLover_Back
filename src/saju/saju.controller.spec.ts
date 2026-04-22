import { Test, TestingModule } from '@nestjs/testing';
import { SajuController } from './saju.controller';
import { SajuService } from './saju.service';

describe('SajuController', () => {
  let controller: SajuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SajuController],
      providers: [SajuService],
    }).compile();

    controller = module.get<SajuController>(SajuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
