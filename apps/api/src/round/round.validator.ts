import {
  IsISO8601,
  IsString,
  isString,
  MaxLength,
  MinLength,
} from "class-validator";
import { Round } from "../entities/Round.entity";

export class CreateRound {
  constructor(data: Partial<Omit<Round, "id">>) {
    Object.assign(this, data);
  }

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @IsISO8601()
  startedAt: Date;

  @IsISO8601()
  endedAt: Date;
}
