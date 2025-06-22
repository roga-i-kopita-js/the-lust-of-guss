import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { RoleArray, ROLES_KEY } from "./roles.decorator";
import { ParsedToken } from "./user.service";
import { Socket } from "socket.io";

export type SocketWithToken = Omit<Socket, "data"> & {
  data: { tokenMeta: ParsedToken };
};

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractTokenFromHeader(client);
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const tokenMeta = this.jwtService.verify<ParsedToken>(token, {
        secret: this.configService.get<string>("APP_JWT_SECRET_KEY"),
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      client.data["tokenMeta"] = tokenMeta;

      const requiredRoles = this.reflector.getAllAndOverride<RoleArray>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      // если роли переданы проводим проверку на предоставленные пермишины
      if (requiredRoles?.length) {
        for (const item of requiredRoles) {
          // если вообще нет такой сущности то реджектим
          if (!tokenMeta.role.permissions[item.entity]) {
            throw new Error("forbidden");
          }

          // или если отсутствуют пермишины, то тоже реджектим
          if (!tokenMeta.role.permissions[item.entity].includes(item.action)) {
            throw new Error("forbidden");
          }
        }
      }
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const [type, token] = (client.handshake.headers.authorization ?? "").split(
      " ",
    );
    return type === "Bearer" ? token : undefined;
  }
}
