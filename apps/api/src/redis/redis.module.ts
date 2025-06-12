import { Module, Global } from "@nestjs/common";
import { REDIS_CLIENT } from "./redis.constants";
import Redis from "ioredis";
import { redisConfig } from "../config/redis.config";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        return new Redis(redisConfig);
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
