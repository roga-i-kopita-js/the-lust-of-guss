import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/User.entity";
import {
  DataSource,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from "typeorm";
import { Role } from "../entities/Role.entity";
import { PlayerRound, Round } from "../entities/Round.entity";
import { CreateRound, RoundListOptions } from "./round.validator";
import { REDIS_CLIENT } from "../redis/redis.constants";
import Redis from "ioredis";
import { ParsedToken } from "../user/user.service";
import { FindOptionsWhere } from "typeorm/find-options/FindOptionsWhere";
import { EventEmitter2 } from "@nestjs/event-emitter";

export type HitInfo = {
  id: string;
  hp: number;
  score: number;
  flushed: boolean;
  leaderboard: Array<{ playerId: string; score: number }>;
  winner: User | null;
  status: "pending" | "active" | "finished";
};

export type RoundListResponse = {
  items: Array<Round>;
  total: number;
};

@Injectable()
export class RoundService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    protected userRepository: Repository<User>,
    @InjectRepository(Role)
    protected roleRepository: Repository<Role>,
    @InjectRepository(Round)
    protected roundRepository: Repository<Round>,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
    private events: EventEmitter2,
  ) {}

  private readonly logger = new Logger(RoundService.name);
  protected readonly startedHp: number = 0;
  protected readonly defaultHp: number = 100;

  public async getGameById(id: string): Promise<Round> {
    return this.roundRepository.findOneOrFail({
      where: { id },
      relations: ["winner", "participants", "participants.player"],
    });
  }

  public async getHitInfo(gameId: string, meta: ParsedToken): Promise<HitInfo> {
    const game = await this.getGameById(gameId);

    const now = Date.now();
    const start = new Date(game.startedAt).getTime();
    const end = new Date(game.endedAt).getTime();

    // 2) Если игра ещё не началась
    if (now < start) {
      const result = this.getEmptyRound(game);
      return { ...result, status: "pending" };
    }

    if (now > end || game.winner) {
      return this.getFinishedRound(game);
    }

    const { clicksKey, boardKey, flushedKey, redisPlayer } = this.getGamesKey(
      game,
      meta,
    );

    const [hpRaw, userScoreRaw, rawEntries, flushedFlag] = await Promise.all([
      this.redis.get(clicksKey),
      this.redis.zscore(boardKey, redisPlayer),
      this.redis.zrevrange(boardKey, 0, -1, "WITHSCORES"),
      this.redis.exists(flushedKey),
    ]);

    const hp = Number(hpRaw) || 0;
    const score = Number(userScoreRaw) || 0;
    const flushed = flushedFlag === 1;

    if (flushed) {
      return this.getFinishedRound(game);
    }

    const leaderboard: HitInfo["leaderboard"] = [];
    for (let i = 0; i < rawEntries.length; i += 2) {
      const p = String(rawEntries[i]).replace(/^player:/, "");
      const s = Number(rawEntries[i + 1]);
      leaderboard.push({ playerId: p, score: s });
    }

    return {
      id: game.id,
      hp,
      score,
      flushed,
      leaderboard,
      winner: null,
      status: "active",
    };
  }

  public async createRound(
    roundData: CreateRound,
    meta: ParsedToken,
  ): Promise<Round> {
    const initialRound = await this.roundRepository.save(
      this.roundRepository.create({
        hp: this.defaultHp,
        touchedHp: this.startedHp,
        ...roundData,
      }),
    );

    const game = await this.getGameById(initialRound.id);

    await this.initializeGameInRedis(game, meta);

    this.logger.log(`round with id: ${game.id} was created successfully.`);
    this.events.emit("round.create", game);
    return game;
  }

  protected readonly updateScript = `
    -- KEYS[1] = globalDamageKey      e.g. "game:123:clicks"
    -- KEYS[2] = leaderboardKey       e.g. "game:123:leaderboard"
    -- KEYS[3] = flushedFlagKey       e.g. "game:123:flushed"
    -- KEYS[4] = maxHpKey             e.g. "game:123:maxHp"
    -- KEYS[5] = tapsHashKey          e.g. "game:123:taps"
    --
    -- ARGV:
    -- ARGV[1] = playerId             e.g. "player:42"
    -- ARGV[2] = requestedDelta       e.g. "1"
    
    -- Если уже флашили — сразу выходим
    if redis.call('EXISTS', KEYS[3]) == 1 then
      return { -1, -1, 0 }
    end
    
    -- Прочитаем и проинкрементим счётчик *тапов* этого игрока
    local taps = redis.call('HINCRBY', KEYS[5], ARGV[1], 1)
    
    -- Приводим requested delta к числу
    local reqDelta = tonumber(ARGV[2]) or 1
    
    -- Берём глобальный урон и maxHp
    local prevTotalRaw = redis.call('GET', KEYS[1])
    local prevTotal = tonumber(prevTotalRaw) or 0
    local maxHp = tonumber(redis.call('GET', KEYS[4])) or math.huge
    
    -- Вычисляем rawDelta: каждый 11-й тап даёт 10, иначе reqDelta
    local rawDelta = (taps % 11 == 0) and 10 or reqDelta
    
    -- Clamp по оставшемуся глобальному бюджету
    local spaceGlobal = maxHp - prevTotal
    local delta = 0
    if spaceGlobal > 0 then
      delta = (rawDelta < spaceGlobal) and rawDelta or spaceGlobal
    end
    
    -- Атомарно применяем урон и обновляем счёт игрока
    local newTotal = redis.call('INCRBY', KEYS[1], delta)
    local newScore = redis.call('ZINCRBY', KEYS[2], delta, ARGV[1])
    
    -- ставим флаг flushed если игра заверщена
    local flushed = 0
    if newTotal >= maxHp then
      if redis.call('SETNX', KEYS[3], '1') == 1 then
        flushed = 1
      end
    end
    
    -- Собираем leaderboard
    local entries    = redis.call('ZRANGE', KEYS[2], 0, -1, 'WITHSCORES')
    local totalElems = #entries
    local pairsCount = math.floor(totalElems / 2)
    
    local result = { newTotal, newScore, flushed, pairsCount }
    for i = 1, totalElems do
      table.insert(result, entries[i])
    end
    return result
`;

  public getFinishedRound(game: Round): HitInfo {
    const score = game.participants.find((p) => p.player.id === game.winner.id);
    const leaderBoard: HitInfo["leaderboard"] = [];
    game.participants.forEach((pr) => {
      leaderBoard.push({
        playerId: pr.player.id,
        score: pr.clicksCount,
      });
    });
    return {
      id: game.id,
      hp: game.hp,
      score: score?.clicksCount ?? 0,
      flushed: true,
      leaderboard: game.participants.map((pr) => ({
        playerId: pr.player.id,
        score: pr.clicksCount,
      })),
      winner: game.winner,
      status: "finished",
    };
  }

  public getEmptyRound(game: Round): HitInfo {
    return {
      id: game.id,
      hp: game.hp,
      score: 0,
      flushed: false,
      leaderboard: [],
      winner: null,
      status: "pending",
    };
  }

  protected async initializeGameInRedis(
    game: Round,
    meta: ParsedToken,
  ): Promise<void> {
    const { clicksKey, boardKey, maxHpKey, ttlKey, ttlStartKey } =
      this.getGamesKey(game, meta);
    if (!(await this.redis.exists(maxHpKey))) {
      const ttl = Math.max(
        0,
        Math.floor((game.endedAt.getTime() - Date.now()) / 1000),
      );

      const startTtl = Math.max(
        0,
        Math.floor((game.startedAt.getTime() - Date.now()) / 1000),
      );

      await this.redis
        .multi()
        .set(ttlKey, "1", "EX", ttl)
        .set(ttlStartKey, "0", "EX", startTtl)
        .set(maxHpKey, game.hp.toString())
        .del(clicksKey, boardKey)
        .exec();
      const justSet = await this.redis.get(maxHpKey);
      this.logger.log(`game (id: ${game.id}) was initialized in redis`);
    }
  }

  public getGamesKey(
    game: Round,
    meta?: ParsedToken,
  ): {
    clicksKey: string;
    boardKey: string;
    flushedKey: string;
    redisPlayer: string;
    tapsHashKey: string;
    ttlKey: string;
    ttlStartKey: string;
    maxHpKey: string;
  } {
    const { id: gameId } = game;

    const clicksKey = `game:${gameId}:clicks`;
    const boardKey = `game:${gameId}:leaderboard`;
    const flushedKey = `game:${gameId}:flushed`;
    const maxHpKey = `game:${gameId}:maxHp`;
    const redisPlayer = `player:${meta?.id}`;
    const tapsHashKey = `game:${gameId}:taps`;
    const ttlKey = `game:${game.id}:ttl`;
    const ttlStartKey = `game-start:${game.id}:ttl`;

    return {
      clicksKey,
      boardKey,
      flushedKey,
      redisPlayer,
      tapsHashKey,
      maxHpKey,
      ttlKey,
      ttlStartKey,
    };
  }

  protected async playRound(game: Round, meta: ParsedToken): Promise<HitInfo> {
    const {
      clicksKey,
      boardKey,
      flushedKey,
      redisPlayer,
      tapsHashKey,
      maxHpKey,
    } = this.getGamesKey(game, meta);

    if (!(await this.redis.exists(maxHpKey))) {
      this.logger.debug(
        `maxHpKey not found, initializing game ${game.id} in Redis`,
      );
      await this.initializeGameInRedis(game, meta);
    }

    // Атомарно обновляем состояние записи в редис, чтобы избежать гонки
    const raw = (await this.redis.eval(
      this.updateScript,
      5,
      clicksKey,
      boardKey,
      flushedKey,
      maxHpKey,
      tapsHashKey,
      redisPlayer,
      meta.role.name === "nikita" ? "0" : "1",
    )) as [number, number, number, number];

    const total = Number(raw[0]);

    // если вернулся флаг flushed, значит игра завершена, и мы должны обновить БД
    const flushed = Number(raw[2]) === 1;

    if (flushed) {
      return await this.flushGame(game, meta);
    }

    // Дальше идут numEntries пар [playerId, score]
    const pairsCount = Number(raw[3]);

    const leaderboard = [];
    for (let i = 0; i < pairsCount; i++) {
      const member = String(raw[4 + i * 2]).replace(/^player:/, "");
      const score = Number(raw[4 + i * 2 + 1]);
      leaderboard.push({ playerId: member, score });
    }

    return {
      id: game.id,
      hp: total,
      score: Number(raw[1]),
      flushed,
      leaderboard,
      winner: null,
      status: flushed ? "finished" : "active",
    };
  }

  public async flushGame(
    roundData: Round,
    meta?: ParsedToken,
  ): Promise<HitInfo> {
    const gameId = roundData.id;
    const { boardKey, clicksKey, maxHpKey, flushedKey } = this.getGamesKey(
      roundData,
      meta,
    );
    const entries = await this.redis.zrevrange(boardKey, 0, -1, "WITHSCORES");
    const leaderBoard: HitInfo["leaderboard"] = [];

    // вычисляем победителя
    let winnerId: null | string = null;
    let prevClicksCount: number = -1;
    let touchedHp: number = 0;
    let winner: User | null = null;

    for (let i = 0; i < entries.length; i += 2) {
      const clicks = parseInt(entries[i + 1], 10);
      const player = entries[i].replace("player:", "");
      if (clicks > prevClicksCount) {
        prevClicksCount = clicks;
        winnerId = player;
      }
      touchedHp += clicks;
      leaderBoard.push({
        playerId: player,
        score: clicks,
      });
    }

    // обновляем базу только если есть победитель
    if (winnerId) {
      await this.dataSource.manager.transaction(async (manager) => {
        // обновляем связанные записи в таблице
        await Promise.all(
          leaderBoard.map(({ playerId, score }) => {
            const repository = manager.getRepository(PlayerRound);

            const playerRound = repository.create({
              player: { id: playerId },
              round: { id: roundData.id },
              clicksCount: score,
            });

            return repository.save(playerRound);
          }),
        );

        // ищем запись с победителем
        winner = await manager
          .getRepository(User)
          .findOneOrFail({ where: { id: winnerId } });

        // обновляем сам раунд
        await manager
          .getRepository(Round)
          .update({ id: gameId }, { winner, touchedHp });
      });
    }

    // чистим redis
    await this.redis
      .multi()
      .del(clicksKey, boardKey, maxHpKey)
      .expire(flushedKey, 60 * 60)
      .exec();

    const result: HitInfo = {
      id: roundData.id,
      hp: roundData.hp,
      flushed: true,
      score: touchedHp,
      leaderboard: leaderBoard,
      winner,
      status: "finished",
    };
    this.logger.log(`game (id: ${gameId}) was flushed`);
    this.events.emit("round.flushed", result);
    return result;
  }

  public async hit(gameId: string, meta: ParsedToken): Promise<HitInfo> {
    const game = await this.getGameById(gameId);

    const now = Date.now();
    const start = new Date(game.startedAt).getTime();

    // если игра не началась возвращаем дефолтный hitInfo
    if (now < start) {
      const result = this.getEmptyRound(game);
      return {
        ...result,
        status: "pending",
      };
    }

    const end = new Date(game.endedAt).getTime();

    // если игра уже завершена возврашаем HitInfo
    if (now > end || typeof game.winner?.id !== "undefined") {
      const result = this.getFinishedRound(game);
      this.events.emit("round", result);
      return result;
    }

    const result = await this.playRound(game, meta);

    this.logger.log(
      `game (id: ${gameId}) was hit successfully by player: ${meta.id}`,
    );
    this.events.emit("round", result);

    return result;
  }

  public async getRoundList(
    params: RoundListOptions,
  ): Promise<RoundListResponse> {
    const options: FindOptionsWhere<Round> = {};
    if (params.id) {
      options.id = params.id;
    }

    if (params.startedAt) {
      options.startedAt = MoreThanOrEqual(params.startedAt);
    }

    if (params.endedAt) {
      options.endedAt = LessThanOrEqual(params.endedAt);
    }

    const [items, total] = await this.roundRepository.findAndCount({
      where: options,
      skip: params.offset ?? 0,
      take: params.limit ?? 20,
      relations: ["winner", "participants", "participants.player"],
    });

    return {
      items,
      total,
    };
  }
}
