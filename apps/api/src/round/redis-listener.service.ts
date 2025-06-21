import { Injectable, OnModuleInit, Logger, Inject } from "@nestjs/common";
import { Redis } from "ioredis";
import { REDIS_CLIENT, REDIS_SUBSCRIBER } from "../redis/redis.constants";
import { RoundService } from "./round.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Round } from "../entities/Round.entity";
import { Repository } from "typeorm";

@Injectable()
export class RedisListenerService implements OnModuleInit {
  private readonly logger = new Logger(RedisListenerService.name);

  constructor(
    @Inject(REDIS_SUBSCRIBER) private readonly sub: Redis,
    private readonly roundService: RoundService,
    @InjectRepository(Round)
    protected roundRepository: Repository<Round>,
  ) {}

  protected async subscribe(key: string): Promise<void> {
    if (key.startsWith("game:") && key.endsWith(":ttl")) {
      const gameId = key.split(":")[1];
      this.logger.log(`TTL expired for game ${gameId}, auto-flushing`);

      try {
        const game = await this.roundRepository.findOneOrFail({
          where: { id: gameId },
          relations: ["winner", "participants", "participants.player"],
        });
        await this.roundService.flushGame(game);
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
