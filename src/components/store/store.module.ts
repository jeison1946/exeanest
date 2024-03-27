import { Module } from '@nestjs/common';
import { LiveController } from './controller/live/live.controller';
import { LiveService } from './services/live/live.service';
import { ResponseService } from '@customServices/response/response.service';
import { StatusposController } from './controller/statuspos/statuspos.controller';
import { StatusposService } from './services/statuspos/statuspos.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StatusPos,
  StatusPosSchema,
} from './entities/statuspos/statuspos.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StatusPos.name, schema: StatusPosSchema },
    ]),
  ],
  providers: [ResponseService, LiveService, StatusposService],
  controllers: [LiveController, StatusposController],
})
export class StoreModule {}
