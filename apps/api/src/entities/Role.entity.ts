import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
} from "typeorm";
import { Permission } from "./Permission.entity";
import { User } from "./User.entity";

@Entity()
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 30 })
  name: string;

  @ManyToMany(() => Permission, (perm) => perm.roles, { cascade: true })
  @JoinTable()
  permissions: Permission[];

  @OneToMany(() => User, (user) => user.role)
  users: Array<User>;
}
