import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User.entity";

@Entity()
export class Round {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 60 })
  name: string;

  @Column({ type: "integer", nullable: false })
  hp: number;

  @Column({ type: "integer", nullable: false })
  touchedHp: number;

  @Column({ type: "timestamptz" })
  startedAt: Date;

  @Column({ type: "timestamptz" })
  endedAt: Date;

  @OneToMany(() => PlayerRound, (pr) => pr.round)
  participants: PlayerRound[];

  @ManyToOne(() => User, (pr) => pr)
  @JoinColumn({ name: "winnerId" })
  winner: User;
}

@Entity()
@Unique(["player", "round"])
export class PlayerRound {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (player) => player.rounds, {
    nullable: false,
    onDelete: "CASCADE",
  })
  player: User;

  @ManyToOne(() => Round, (round) => round.participants, {
    nullable: false,
    onDelete: "CASCADE",
  })
  round: Round;

  // индивидуальный счётчик кликов игрока
  @Column({ type: "int", default: 0 })
  clicksCount: number;
}
