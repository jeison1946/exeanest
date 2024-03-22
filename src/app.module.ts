import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { StoreModule } from './components/store/store.module';
import { GatewaysGateway } from './components/gateways/gateways.gateway';
import { DatabaseModule } from '@customcore/database/database.module';
import { StatusposService } from './components/store/services/statuspos/statuspos.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StatusPos,
  StatusPosSchema,
} from './components/store/entities/statuspos/statuspos.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    MongooseModule.forFeature([
      { name: StatusPos.name, schema: StatusPosSchema },
    ]),
    StoreModule,
  ],
  controllers: [AppController],
  providers: [AppService, StatusposService, GatewaysGateway],
})
export class AppModule {}
