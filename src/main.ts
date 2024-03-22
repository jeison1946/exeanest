import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
//import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //Configurate Cors
  app.enableCors({
    origin: process.env.ORIGIN.split(', '),
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PATCH'],
    credentials: false,
  });
  //Configurate Dto Validation
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        const response = {
          code: 400,
          message: errors.map((error) => ({
            property: error.property,
            message: error.constraints[Object.keys(error.constraints)[0]],
          })),
        };
        return new BadRequestException(response);
      },
      stopAtFirstError: true,
    }),
  );

  await app.listen(process.env.PORT);
}
bootstrap();
