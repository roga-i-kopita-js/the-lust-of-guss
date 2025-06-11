import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./Role.entity";

@Entity()
export class Permission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 120, nullable: false })
  entity: string;

  @Column({ type: "varchar", length: 30, nullable: false })
  action: "create" | "read" | "delete" | "update";

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
