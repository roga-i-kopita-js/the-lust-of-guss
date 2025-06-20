import { Body, Controller, Post, BadRequestException } from "@nestjs/common";
import { CreateRound } from "./round.validator";
import { Round } from "../entities/Round.entity";
import { RoundService } from "./round.service";
import { Roles } from "../user/roles.decorator";

@Controller("round")
export class RoundController {
  constructor(private readonly roundService: RoundService) {}

  @Roles({ action: "create", entity: "round" })
  @Post("/create")
  public async createRound(@Body() body: CreateRound): Promise<Round> {
    try {
      return await this.roundService.createRound(body);
    } catch (error) {
      throw new BadRequestException({ message: (error as Error).message });
    }
  }
}
