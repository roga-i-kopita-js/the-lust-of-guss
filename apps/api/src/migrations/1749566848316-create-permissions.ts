import { MigrationInterface, QueryRunner } from "typeorm";
import { Permission } from "../entities/Permission.entity";

export class CreatePermissions1749566848316 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into(Permission)
      .values([
        { entity: "round", action: "create" },
        { entity: "round", action: "read" },
        { entity: "round", action: "update" },
        { entity: "round", action: "delete" },
      ])
      .execute();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(Permission)
      .where([
        { entity: "round", action: "create" },
        { entity: "round", action: "read" },
        { entity: "round", action: "update" },
        { entity: "round", action: "delete" },
      ])
      .execute();
  }
}
