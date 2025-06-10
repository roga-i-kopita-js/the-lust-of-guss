import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { MicroOrmConfig } from "../config/micro-orm.config";

console.log(MicroOrmConfig);

@Module({
  imports: [MikroOrmModule.forRoot(MicroOrmConfig)],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
