import * as dotenv from "dotenv";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { MikroOrmModuleSyncOptions } from "@mikro-orm/nestjs/typings";
dotenv.config();
import { resolve } from "node:path";

console.log(resolve("../src/entities"));
export const MicroOrmConfig: MikroOrmModuleSyncOptions = {
  entities: ["./dist/src/entities/*.js"], // for production
  entitiesTs: ["./src/entities/*.ts"], // for development
  dbName: process.env.POSTGRES_DATABASE,
  driver: PostgreSqlDriver, // Changed to PostgreSQL
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT ?? "3000"),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  autoLoadEntities: true,
};
