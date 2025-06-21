import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Role } from "./Role.entity";
import { PlayerRound } from "./Round.entity";
import { Exclude } from "class-transformer";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 30 })
  username: string;

  @Exclude()
  @Column({ type: "varchar", length: 220 })
  password: string;

  @Exclude()
  @Column({ type: "varchar", length: 200 })
  salt: string;

  @ManyToOne(() => Role, (role) => role.users, { onDelete: "CASCADE" })
  role: Role;

  @OneToMany(() => PlayerRound, (pr) => pr.player)
  rounds: PlayerRound[];
}
