import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:3000'], // Vite dev server and other origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const configService = app.get(ConfigService);
  const portRaw = configService.get('PORT');
  const port = typeof portRaw === 'string' || typeof portRaw === 'number' ? portRaw : undefined;

  const listenPort = Number(port ?? 3000);
  await app.listen(listenPort);
  console.log(`Application is running on: http://localhost:${listenPort}`);
}
bootstrap();
