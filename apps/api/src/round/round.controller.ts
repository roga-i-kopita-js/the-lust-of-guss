import {
  Body,
  Controller,
  Post,
  BadRequestException,
  Request,
  UseGuards,
  Get,
  Query,
} from "@nestjs/common";
import {
  CreateRound,
  HitInfoOptions,
  PlayRound,
  RoundListOptions,
} from "./round.validator";
import { Round } from "../entities/Round.entity";
import { HitInfo, RoundListResponse, RoundService } from "./round.service";
import { Roles } from "../user/roles.decorator";
import { ParsedToken } from "../user/user.service";
import { AuthGuard } from "../user/auth.guard";

@UseGuards(AuthGuard)
@Controller("round")
export class RoundController {
  constructor(private readonly roundService: RoundService) {}

  @Roles({ action: "create", entity: "round" })
  @Post("/create")
  public async createRound(
    @Request() request: { tokenMeta: ParsedToken },
    @Body() body: CreateRound,
  ): Promise<Round> {
    try {
      return await this.roundService.createRound(body, request.tokenMeta);
    } catch (error) {
      throw new BadRequestException({ message: (error as Error).message });
    }
  }

  @Roles({ action: "update", entity: "round" })
  @Post("/play")
  public async playRound(
    @Request() request: { tokenMeta: ParsedToken },
    @Body() body: PlayRound,
  ): Promise<HitInfo> {
    try {
      return await this.roundService.hit(body.id, request.tokenMeta);
    } catch (error) {
      throw new BadRequestException({ message: (error as Error).message });
    }
  }

  @Roles({ action: "read", entity: "round" })
  @Get("/list")
  public async getRounds(
    @Query() data: RoundListOptions,
  ): Promise<RoundListResponse> {
    try {
      return await this.roundService.getRoundList(data);
    } catch (error) {
      throw new BadRequestException({ message: (error as Error).message });
    }
  }

  @Roles({ action: "read", entity: "round" })
  @Get("/hit-info")
  public async getRoundHitInfo(
    @Request() request: { tokenMeta: ParsedToken },
    @Query() data: HitInfoOptions,
  ): Promise<HitInfo> {
    try {
      return await this.roundService.getHitInfo(data.id, request.tokenMeta);
    } catch (error) {
      throw new BadRequestException({ message: (error as Error).message });
    }
  }
}
