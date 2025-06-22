import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../entities/User.entity";
import { JwtModule } from "@nestjs/jwt";
import { jwtConfig } from "../config/jwt.config";
import { Role } from "../entities/Role.entity";
import { AuthGuard } from "./auth.guard";
import { WsAuthGuard } from "./ws-auth.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    JwtModule.register(jwtConfig),
  ],
  controllers: [UserController],
  providers: [UserService, AuthGuard, WsAuthGuard],
  exports: [JwtModule],
})
export class UserModule {}
