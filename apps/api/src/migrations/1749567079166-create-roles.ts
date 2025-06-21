import { MigrationInterface, QueryRunner } from "typeorm";
import { Role } from "../entities/Role.entity";
import { Permission } from "../entities/Permission.entity";

export class CreateRoles1749567079166 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissionRepo = queryRunner.manager.getRepository(Permission);
    const [create, read, update, _delete] = await Promise.all([
      permissionRepo
        .createQueryBuilder("permission")
        .where("permission.entity = :entity AND permission.action = :action", {
          entity: "round",
          action: "create",
        })
        .getOne(),
      permissionRepo
        .createQueryBuilder("permission")
        .where("permission.entity = :entity AND permission.action = :action", {
          entity: "round",
          action: "read",
        })
        .getOne(),
      permissionRepo
        .createQueryBuilder("permission")
        .where("permission.entity = :entity AND permission.action = :action", {
          entity: "round",
          action: "update",
        })
        .getOne(),
      permissionRepo
        .createQueryBuilder("permission")
        .where("permission.entity = :entity AND permission.action = :action", {
          entity: "round",
          action: "delete",
        })
        .getOne(),
    ]);

    if (!create || !read || !update || !_delete) {
      throw new Error("Permissions not found");
    }

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into(Role)
      .values([{ name: "admin" }, { name: "player" }, { name: "nikita" }])
      .execute();

    const roleRepo = queryRunner.manager.getRepository(Role);

    const adminRole = await roleRepo.findOneByOrFail({ name: "admin" });
    const playerRole = await roleRepo.findOneByOrFail({ name: "player" });
    const nikitaRole = await roleRepo.findOneByOrFail({ name: "nikita" });

    // Устанавливаем связи с пермишенами
    adminRole.permissions = [create, read, _delete];
    playerRole.permissions = [read, update];
    nikitaRole.permissions = [read, update];

    await roleRepo.save([adminRole, playerRole, nikitaRole]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем созданные роли
    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(Role)
      .where("name IN (:...names)", { names: ["admin", "player", "nikita"] })
      .execute();
  }
}
