import { Test, TestingModule } from '@nestjs/testing';
import { ConsultGateway } from './consult.gateway';

describe('ConsultGateway', () => {
  let gateway: ConsultGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsultGateway],
    }).compile();

    gateway = module.get<ConsultGateway>(ConsultGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
