import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ormConfig } from "./config/orm.config";
import { UserModule } from "./user/user.module";
import { RedisModule } from "./redis/redis.module";
import { RoundModule } from './round/round.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
      cache: true,
    }),
    TypeOrmModule.forRoot(ormConfig),
    UserModule,
    RedisModule,
    RoundModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
