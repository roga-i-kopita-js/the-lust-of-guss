import { Inject, Injectable } from "@nestjs/common";
import { REDIS_CLIENT } from "./redis/redis.constants";
import Redis from "ioredis";

@Injectable()
export class AppService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}
  async getHello(): Promise<string> {
    const t = await this.redis.get("mykey");
    return t ?? "";
  }
}
