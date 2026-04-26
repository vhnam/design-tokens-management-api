import { NestFactory } from '@nestjs/core';
import 'dotenv/config';

import { AppModule } from './app.module';
import { env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });
  app.enableCors({
    origin: [env.CORS_ORIGIN],
    credentials: true,
  });
  await app.listen(env.API_PORT);
}
void bootstrap();
