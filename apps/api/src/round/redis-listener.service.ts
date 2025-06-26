import { Injectable, OnModuleInit, Logger, Inject } from "@nestjs/common";
import { Redis } from "ioredis";
import { REDIS_SUBSCRIBER } from "../redis/redis.constants";
import { RoundService } from "./round.service";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class RedisListenerService implements OnModuleInit {
  private readonly logger = new Logger(RedisListenerService.name);

  constructor(
    @Inject(REDIS_SUBSCRIBER) private readonly sub: Redis,
    private readonly roundService: RoundService,
    private events: EventEmitter2,
  ) {}

  protected async subscribe(key: string): Promise<void> {
    if (key.startsWith("game:") && key.endsWith(":ttl")) {
      const gameId = key.split(":")[1];
      this.logger.log(`TTL expired for game ${gameId}, auto-flushing`);

      try {
        const game = await this.roundService.getGameById(gameId);
        const info = await this.roundService.flushGame(game);

        this.events.emit("round", info);
      } catch (err) {
        this.logger.error(err);
      }
    }

    if (key.startsWith("game-start:") && key.endsWith(":ttl")) {
      const gameId = key.split(":")[1];
      this.logger.log(`Game with ${gameId}, auto-starting`);

      try {
        const game = await this.roundService.getGameById(gameId);

        this.events.emit("round", {
          ...this.roundService.getEmptyRound(game),
          status: "active",
        });
      } catch (err) {
        this.logger.error(err);
      }
    }
  }

  public async onModuleInit(): Promise<void> {
    await this.sub.subscribe("__keyevent@0__:expired");
    this.sub.on("message", (_channel, key) => {
      this.subscribe(key);
    });
    this.logger.log("RedisListenerService initialized");
  }
}
