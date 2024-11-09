import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await createNestApp();

  const config = new DocumentBuilder()
    .setTitle('Audio Mixer')
    .setDescription('Endpoints para mixagem de áudio')
    .setVersion('1.0')
    .build();

  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: 422,
      transform: true,
    }),
  );

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const PORT = process.env.PORT || 3000;

  await app.listen(PORT).catch(console.log);
}
bootstrap();

export async function createNestApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: ['https://organizandotudo.netlify.app'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
      allowedHeaders: [
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Requested-With',
        'Origin',
        'api-key',
      ],
      credentials: true,
    },
  });

  return app;
}
