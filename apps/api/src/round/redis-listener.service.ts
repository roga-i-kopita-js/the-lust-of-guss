import {
  Injectable,
  OnModuleInit,
  Logger,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { Redis } from "ioredis";
import { REDIS_SUBSCRIBER } from "../redis/redis.constants";
import { RoundService } from "./round.service";
import { RoundGateway } from "./round.gateway";

@Injectable()
export class RedisListenerService implements OnModuleInit {
  private readonly logger = new Logger(RedisListenerService.name);

  constructor(
    @Inject(REDIS_SUBSCRIBER) private readonly sub: Redis,
    private readonly roundService: RoundService,
    @Inject(forwardRef(() => RoundGateway))
    private readonly gateway: RoundGateway,
  ) {}

  protected async subscribe(key: string): Promise<void> {
    if (key.startsWith("game:") && key.endsWith(":ttl")) {
      const gameId = key.split(":")[1];
      this.logger.log(`TTL expired for game ${gameId}, auto-flushing`);

      try {
        const game = await this.roundService.getGameById(gameId);
        await this.roundService.flushGame(game);

        this.gateway.server
          .to(gameId)
          .emit("finished", this.roundService.getFinishedRound(game));
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
