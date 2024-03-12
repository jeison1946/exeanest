import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
//import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:4200'],
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PATCH'],
    credentials: true,
  });
  //app.useWebSocketAdapter(new WsAdapter(app));
  await app.listen(process.env.PORT);
}
bootstrap();
