import { Module } from '@nestjs/common';
import { StatusController } from './status/status.controller';
import { ConsultGateway } from './consult/consult.gateway';

@Module({
  providers: [StatusController, ConsultGateway],
})
export class StoreModule {}
