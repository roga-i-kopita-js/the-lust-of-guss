import * as dotenv from "dotenv";
import { JwtModuleOptions } from "@nestjs/jwt";

dotenv.config();

export const jwtConfig: JwtModuleOptions = {
  secret: process.env.APP_JWT_SECRET_KEY,
  publicKey: process.env.JWT_PUBLIC_KEY,
  signOptions: { expiresIn: "1 days" },
};
