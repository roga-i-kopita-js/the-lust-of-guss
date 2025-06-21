import { Global, Module } from "@nestjs/common";
import { REDIS_CLIENT, REDIS_SUBSCRIBER } from "./redis.constants";
import Redis from "ioredis";
import { redisConfig } from "../config/redis.config";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (): Redis => {
        const client = new Redis(redisConfig);
        client
          .config("SET", "notify-keyspace-events", "Ex")
          .catch(console.error);
        return client;
      },
    },
    {
      provide: REDIS_SUBSCRIBER,
      useFactory: (): Redis => {
        return new Redis(redisConfig);
      },
    },
  ],
  exports: [REDIS_CLIENT, REDIS_SUBSCRIBER],
})
export class RedisModule {}
