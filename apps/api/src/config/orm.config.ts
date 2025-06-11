import * as dotenv from "dotenv";
import { TypeOrmModuleOptions } from "@nestjs/typeorm/dist/interfaces/typeorm-options.interface";

dotenv.config();

export const ormConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  synchronize: process.env.NODE_ENV === "development",
  entities: ["dist/**/*.entity.js"],
  migrations: ["dist/src/migrations/*.js"],
  migrationsRun: true,
};
