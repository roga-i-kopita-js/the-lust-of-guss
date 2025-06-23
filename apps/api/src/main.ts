import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ClassSerializerInterceptor, ValidationPipe } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Автоматически валидировать все DTO и возвращать 400 при ошибке
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // отбрасывать лишние поля
      forbidNonWhitelisted: true, // бросать ошибку, если в теле есть неописанные в DTO поля
      transform: true, // превращать payload в инстансы классов (необязательно для валидации)
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.enableCors({ origin: "*" });
  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
