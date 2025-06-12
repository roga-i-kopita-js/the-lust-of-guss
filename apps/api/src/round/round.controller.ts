import {
  Body,
  Controller,
  Request,
  Post,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { CreateRound } from "./round.validator";
import { Round } from "../entities/Round.entity";
import { AuthGuard } from "../user/auth.guard";
import { RoundService } from "./round.service";

@Controller("round")
export class RoundController {
  constructor(private readonly roundService: RoundService) {}

  @UseGuards(AuthGuard)
  @Post("/create")
  public async createRound(
    @Request() req: { user: { id: string } },
    @Body() body: CreateRound,
  ): Promise<Round> {
    try {
      const user = req.user;
      return await this.roundService.createRound(body, user.id);
    } catch (error) {
      throw new BadRequestException({ message: (error as Error).message });
    }
  }
}
