import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableUnique,
} from "typeorm";

export class CreateRoleTables1749566312916 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Таблица permission
    await queryRunner.createTable(
      new Table({
        name: "permission",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "entity",
            type: "varchar",
            length: "120",
            isNullable: false,
          },
          {
            name: "action",
            type: "varchar",
            length: "30",
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // 2. Таблица role
    await queryRunner.createTable(
      new Table({
        name: "role",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "name",
            type: "varchar",
            length: "30",
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // 3. Join-таблица role_permissions_permission
    await queryRunner.createTable(
      new Table({
        name: "role_permissions_permission",
        columns: [
          {
            name: "roleId",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "permissionId",
            type: "uuid",
            isPrimary: true,
          },
        ],
      }),
      true,
    );

    // Внешние ключи для join-таблицы
    await queryRunner.createForeignKeys("role_permissions_permission", [
      new TableForeignKey({
        columnNames: ["roleId"],
        referencedTableName: "role",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
      new TableForeignKey({
        columnNames: ["permissionId"],
        referencedTableName: "permission",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    ]);

    // 4. Таблица user
    await queryRunner.createTable(
      new Table({
        name: "user",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "username",
            type: "varchar",
            length: "30",
            isUnique: true,
          },
          {
            name: "password",
            type: "varchar",
            length: "220",
          },
          {
            name: "salt",
            type: "varchar",
            length: "200",
          },
          {
            name: "roleId",
            type: "uuid",
          },
        ],
      }),
      true,
    );

    // Внешний ключ user → role
    await queryRunner.createForeignKey(
      "user",
      new TableForeignKey({
        columnNames: ["roleId"],
        referencedTableName: "role",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: "round",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            isGenerated: true,
          },
          { name: "name", type: "varchar", length: "60" },
          { name: "hp", type: "integer" },
          { name: "touchedHp", type: "integer" },
          { name: "startedAt", type: "timestamptz", isNullable: false },
          { name: "endedAt", type: "timestamptz", isNullable: false },
          { name: "winnerId", type: "uuid", isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      "round",
      new TableForeignKey({
        columnNames: ["winnerId"],
        referencedTableName: "user",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
    );

    // Создание таблицы "player_round"
    await queryRunner.createTable(
      new Table({
        name: "player_round",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          { name: "playerId", type: "uuid", isNullable: false },
          { name: "roundId", type: "uuid", isNullable: false },
          { name: "clicksCount", type: "int", default: "0" },
        ],
        uniques: [
          new TableUnique({
            name: "UQ_player_round_player_round",
            columnNames: ["playerId", "roundId"],
          }),
        ],
      }),
      true,
    );

    // Внешний ключ на пользователя (User)
    await queryRunner.createForeignKey(
      "player_round",
      new TableForeignKey({
        columnNames: ["playerId"],
        referencedTableName: "user",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // Внешний ключ на раунд (Round)
    await queryRunner.createForeignKey(
      "player_round",
      new TableForeignKey({
        columnNames: ["roundId"],
        referencedTableName: "round",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем в обратном порядке

    // Удаляем таблицу player_round
    await queryRunner.dropTable("player_round");

    // Удаляем таблицу round
    await queryRunner.dropTable("round");

    //  FK и таблицу user
    const userTable = await queryRunner.getTable("user");
    const userFk = userTable!.foreignKeys.find(
      (fk) => fk.columnNames.indexOf("roleId") !== -1,
    );
    if (userFk) {
      await queryRunner.dropForeignKey("user", userFk);
    }
    await queryRunner.dropTable("user");

    // 2. FK и join-таблицу
    const joinTable = await queryRunner.getTable("role_permissions_permission");
    for (const fk of joinTable!.foreignKeys) {
      await queryRunner.dropForeignKey("role_permissions_permission", fk);
    }
    await queryRunner.dropTable("role_permissions_permission");

    // 3. Таблицы role и permission
    await queryRunner.dropTable("role");
    await queryRunner.dropTable("permission");
  }
}
