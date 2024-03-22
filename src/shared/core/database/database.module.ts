import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        uri: `mongodb+srv://${config.get('DB_USER')}:${config.get('DB_PASSWORD')}@${config.get('DB_CLUSTER')}/?retryWrites=true&w=majority`,
        dbName: config.get('DB_NAME'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
