import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Role } from "./Role.entity";
import { PlayerRound } from "./Round.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 30 })
  username: string;

  @Column({ type: "varchar", length: 120 })
  password: string;

  @ManyToOne(() => Role, (role) => role.users, { onDelete: "CASCADE" })
  role: Role;

  @OneToMany(() => PlayerRound, (pr) => pr.player)
  rounds: PlayerRound[];
}
