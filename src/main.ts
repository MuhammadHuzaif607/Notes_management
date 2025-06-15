import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3001'], // Replace with your frontend URL
    credentials: true, // if using cookies or Authorization headers
  });

  
  await app.listen(3000);
}
bootstrap();
