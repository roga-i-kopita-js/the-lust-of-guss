import { Body, Controller, Post } from "@nestjs/common";
import { IsString, MaxLength, MinLength } from "class-validator";
import { Token, UserService } from "./user.service";

export class Credentials {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  username: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  password: string;
}

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  public async register(@Body() body: Credentials): Promise<Token> {
    return this.userService.registerUser(body.username, body.password);
  }

  @Post("sign-in")
  public async signIn(@Body() body: Credentials): Promise<Token> {
    return this.userService.signInUser(body.username, body.password);
  }
}
