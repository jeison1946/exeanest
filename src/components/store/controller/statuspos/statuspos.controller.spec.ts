import { Test, TestingModule } from '@nestjs/testing';
import { StatusposController } from './statuspos.controller';

describe('StatusposController', () => {
  let controller: StatusposController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatusposController],
    }).compile();

    controller = module.get<StatusposController>(StatusposController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
