import {
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
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

export class PlayRound {
  @IsString()
  @MinLength(1)
  id: string;
}

export class RoundListOptions {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsNumber()
  offset?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsISO8601()
  startedAt?: Date;

  @IsOptional()
  @IsISO8601()
  endedAt?: Date;
}
