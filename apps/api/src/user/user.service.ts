import { Injectable, Logger } from "@nestjs/common";
import { createHmac, randomBytes } from "node:crypto";
import { Repository } from "typeorm";
import { User } from "../entities/User.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { Role } from "../entities/Role.entity";
import { ConfigService } from "@nestjs/config";

import { IsString, MinLength } from "class-validator";

export class Token {
  constructor(data: Partial<Token>) {
    Object.assign(this, data);
  }
  @IsString()
  @MinLength(1)
  token: string;
}

export interface HashWithSalt {
  salt: string;
  hash: string;
}

const SALT_LENGTH = 26;

type EntityName = string;
type ActionList = Array<string>;
export type ParsedToken = {
  id: string;
  name: string;
  role: {
    name: string;
    permissions: Record<EntityName, ActionList>;
  };
};

@Injectable()
export class UserService {
  constructor(
    protected readonly configService: ConfigService,
    protected jwtService: JwtService,
    @InjectRepository(User)
    protected userRepository: Repository<User>,
    @InjectRepository(Role)
    protected roleRepository: Repository<Role>,
  ) {}
  private readonly logger = new Logger(UserService.name);

  protected createHash(value: string, secret: string): HashWithSalt {
    const salt = randomBytes(SALT_LENGTH).toString("hex");

    const hmac = createHmac("sha256", secret);

    hmac.update(salt + value);

    const hash = hmac.digest("hex");

    return { salt, hash };
  }

  protected verifyHash(
    value: string,
    secret: string,
    salt: string,
    hash: string,
  ): boolean {
    const hmac = createHmac("sha256", secret);
    hmac.update(salt + value);
    const computed = hmac.digest("hex");
    return computed === hash;
  }

  protected generateToken(user: User): Token {
    const permissions: ParsedToken["role"]["permissions"] = {};
    user.role.permissions.forEach((permission) => {
      if (!permissions[permission.entity]) {
        permissions[permission.entity] = [permission.action];
      } else {
        permissions[permission.entity].push(permission.action);
      }
    });

    const data: ParsedToken = {
      id: user.id,
      name: user.username,
      role: {
        name: user.role.name,
        permissions,
      },
    };
    const token = this.jwtService.sign(data, {
      secret: this.configService.get<string>("APP_JWT_SECRET_KEY"),
    });

    return new Token({ token });
  }

  public async createUser(username: string, password: string): Promise<User> {
    /**
     *  Назначаем роль в зависмости от ника
     *  Например, если username - admin, то роль admin,
     *  если username Никита, то роль nikita.Иначе Player
     */
    const roleName: string = ["admin", "nikita"].includes(username)
      ? username
      : "player";

    const { hash, salt } = this.createHash(
      password,
      this.configService.get<string>("APP_PASSWORD_SECRET_KEY") ?? "",
    );

    const role = await this.roleRepository.findOneOrFail({
      where: { name: roleName },
      relations: ["permissions"],
    });

    const user = this.userRepository.create({
      username,
      password: hash,
      salt,
      role,
    });

    await this.userRepository.save(user);
    this.logger.log(
      `User created successfully. id: ${user.id} with role ${role.name}`,
    );
    return user;
  }

  public async registerUser(
    username: string,
    password: string,
  ): Promise<Token> {
    const user = await this.createUser(username, password);

    return this.generateToken(user);
  }

  public async signInUser(username: string, password: string): Promise<Token> {
    const secret =
      this.configService.get<string>("APP_PASSWORD_SECRET_KEY") ?? "";

    const user = await this.userRepository.findOneOrFail({
      where: { username },
      relations: ["role", "role.permissions"],
    });

    const isPasswordValid = this.verifyHash(
      password,
      secret,
      user.salt,
      user.password,
    );

    if (!isPasswordValid) {
      throw new Error("Unauthorized");
    }

    this.logger.log(
      `User signed successfully. id: ${user.id} with role ${user.role.name}`,
    );
    return this.generateToken(user);
  }

  //todo Добавить позже можно еще механизм по рефрешу
}
