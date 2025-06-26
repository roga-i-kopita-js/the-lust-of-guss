import {
  IsDate,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { Round } from "../entities/Round.entity";
import { Type } from "class-transformer";

@ValidatorConstraint({ name: "isAfterStart", async: false })
class IsAfterStartConstraint implements ValidatorConstraintInterface {
  validate(endedAt: Date, args: ValidationArguments) {
    const obj = args.object as CreateRound;
    return (
      obj.startedAt instanceof Date &&
      endedAt.getTime() > obj.startedAt.getTime()
    );
  }
  defaultMessage() {
    return "endedAt должен быть позже startedAt";
  }
}

export class CreateRound {
  constructor(data: Partial<Omit<Round, "id">>) {
    Object.assign(this, data);
  }

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @Type(() => Date)
  @IsDate({ message: "startedAt должен быть датой" })
  startedAt: Date;

  @Type(() => Date)
  @IsDate({ message: "endedAt должен быть датой" })
  @Validate(IsAfterStartConstraint)
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

export class HitInfoOptions {
  @IsString()
  id: string;
}
