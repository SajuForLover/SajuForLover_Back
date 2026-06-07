import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    origin: 'http://localhost:5173', // 허용할 프론트엔드 도메인 (배포 시 실제 도메인 사용)
    credentials: true, // 쿠키나 인증 헤더(Authorization)를 포함해야 할 경우 필수
  });


  const options = new DocumentBuilder()
    .setTitle('애인사주오! API')
    .setDescription('API 문서')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);
  // localhost:3000/api-docs

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
