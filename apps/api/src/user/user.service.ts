import { Injectable, UnauthorizedException } from "@nestjs/common";
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...tokenInfo } = user;

    const token = this.jwtService.sign(tokenInfo, {
      secret: this.configService.get<string>("APP_JWT_SECRET_KEY"),
    });

    return new Token({ token });
  }

  public async createUser(username: string, password: string): Promise<User> {
    const existedUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existedUser) {
      throw new Error("User already exists");
    }

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

    const role = await this.roleRepository.findOneByOrFail({ name: roleName });

    const user = this.userRepository.create({
      username,
      password: hash,
      salt,
      role,
    });

    await this.userRepository.save(user);

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

    const user = await this.userRepository.findOneBy({
      username,
    });

    if (!user) {
      throw new Error("Unauthorized");
    }

    const isPasswordValid = this.verifyHash(
      password,
      secret,
      user.salt,
      user.password,
    );

    if (!isPasswordValid) {
      throw new Error("Unauthorized");
    }

    return this.generateToken(user);
  }

  //todo Добавить позже можно еще механизм по рефрешу
}
