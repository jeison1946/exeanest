import { Module } from '@nestjs/common';
import { GatewaysGateway } from './gateways.gateway';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StatusPos,
  StatusPosSchema,
} from '../store/entities/statuspos/statuspos.entity';
import { StatusposService } from '../store/services/statuspos/statuspos.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forFeature([
      { name: StatusPos.name, schema: StatusPosSchema },
    ]),
  ],
  providers: [StatusposService, GatewaysGateway],
})
export class GatewaysModule {}
