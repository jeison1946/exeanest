import { Module } from '@nestjs/common';
import { ConsultGateway } from './consult/consult.gateway';
import { LiveController } from './controller/live/live.controller';
import { LiveService } from './services/live/live.service';
import { ResponseService } from '@customServices/response/response.service';

@Module({
  providers: [ConsultGateway, LiveService, ResponseService],
  controllers: [LiveController],
})
export class StoreModule {}
