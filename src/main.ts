import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { TokenBucketRateLimitInterceptor } from './common/interceptors/token-bucket-rate-limit.interceptor';
import { FixedWindowRateLimitInterceptor } from './common/interceptors/fixed-window-rate-limit.interceptor';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
    credentials: true,
  });
  app.use(helmet());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const configService = app.get(ConfigService);
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new TokenBucketRateLimitInterceptor(configService),
    new FixedWindowRateLimitInterceptor(configService),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Movies REST API')
    .setDescription('A comprehensive REST API for managing movies, users, and watchlists')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'Bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('app.port') || 8080;
  await app.listen(port);
}
bootstrap();
