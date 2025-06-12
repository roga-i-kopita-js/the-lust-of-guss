import { RedisOptions } from "ioredis/built/redis/RedisOptions";
import * as dotenv from "dotenv";

dotenv.config();

export const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  username: process.env.REDIS_USER || undefined,
};
