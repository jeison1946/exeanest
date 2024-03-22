import { Module } from '@nestjs/common';
import { LiveController } from './controller/live/live.controller';
import { LiveService } from './services/live/live.service';
import { ResponseService } from '@customServices/response/response.service';

@Module({
  imports: [],
  providers: [LiveService, ResponseService],
  controllers: [LiveController],
})
export class StoreModule {}
