import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1754039546102 implements MigrationInterface {
  name = 'CreateUserTable1754039546102';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" text NOT NULL, "password" text NOT NULL, "fullName" text NOT NULL, "refreshToken" character varying(768), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_78a916df40e02a9deb1c4b75ed" ON "user" ("username") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_78a916df40e02a9deb1c4b75ed"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
