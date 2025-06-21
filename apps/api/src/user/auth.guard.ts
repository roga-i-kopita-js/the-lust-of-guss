import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { RoleArray, ROLES_KEY } from "./roles.decorator";
import { ParsedToken } from "./user.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const tokenMeta = this.jwtService.verify<ParsedToken>(token, {
        secret: this.configService.get<string>("APP_JWT_SECRET_KEY"),
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      request["tokenMeta"] = tokenMeta;

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

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
