import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { StoreModule } from './components/store/store.module';
import { DatabaseModule } from '@customcore/database/database.module';
import { GatewaysModule } from './components/gateways/gateways.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    StoreModule,
    GatewaysModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
