import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { StoreModule } from './components/store/store.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), StoreModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
