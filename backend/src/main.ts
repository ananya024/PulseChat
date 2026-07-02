// main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // for FRONTEND
  app.enableCors({
    origin: [
      "http://localhost:5173",
      "https://pulse-chat-amber.vercel.app",
      // "https://pulse-chat-b5s7iwldw-ananya024s-projects.vercel.app",
    ],
    credentials: true,
  });
  // app.enableCors({
  //   origin: process.env.CORS_ORIGINS?.split(","),
  //   credentials: true,
  // });
  // app.enableCors({ origin: "http://localhost:5173", credentials: true });
  // ................
  
  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'jwt',
      },
      'jwt-auth',
    )
    .build();


  const document = SwaggerModule.createDocument(app, config);


  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
