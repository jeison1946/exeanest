import { Test, TestingModule } from '@nestjs/testing';
import { StatusposService } from './statuspos.service';

describe('StatusposService', () => {
  let service: StatusposService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatusposService],
    }).compile();

    service = module.get<StatusposService>(StatusposService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
