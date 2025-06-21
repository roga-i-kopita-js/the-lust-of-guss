import { Module } from "@nestjs/common";
import { RoundController } from "./round.controller";
import { RoundService } from "./round.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Round } from "../entities/Round.entity";
import { User } from "../entities/User.entity";
import { Role } from "../entities/Role.entity";
import { UserModule } from "../user/user.module";
import { RedisListenerService } from "./redis-listener.service";

@Module({
  imports: [TypeOrmModule.forFeature([Round, User, Role]), UserModule],
  controllers: [RoundController],
  providers: [RoundService, RedisListenerService],
})
export class RoundModule {}
