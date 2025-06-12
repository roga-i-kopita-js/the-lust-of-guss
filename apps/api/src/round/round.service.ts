import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/User.entity";
import { Repository } from "typeorm";
import { Role } from "../entities/Role.entity";
import { Round } from "../entities/Round.entity";
import { CreateRound } from "./round.validator";

@Injectable()
export class RoundService {
  constructor(
    @InjectRepository(User)
    protected userRepository: Repository<User>,
    @InjectRepository(Role)
    protected roleRepository: Repository<Role>,
    @InjectRepository(Round)
    protected roundRepository: Repository<Round>,
  ) {}

  public async createRound(
    roundData: CreateRound,
    userId: string,
  ): Promise<Round> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["role"],
    });

    if (user?.role.name !== "admin") {
      throw new Error("Access denied");
    }

    const round = this.roundRepository.create(roundData);

    return this.roundRepository.save(round);
  }
}
