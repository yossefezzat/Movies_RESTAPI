import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeMovieIdToUuid1753916400000 implements MigrationInterface {
  name = 'ChangeMovieIdToUuid1753916400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`ALTER TABLE "movies" ADD "new_id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
    await queryRunner.query(`ALTER TABLE "movies" DROP CONSTRAINT "PK_c5b2c134e871bfd1c2fe7cc3705"`);
    await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "movies" RENAME COLUMN "new_id" TO "id"`);
    await queryRunner.query(`ALTER TABLE "movies" ADD CONSTRAINT "PK_c5b2c134e871bfd1c2fe7cc3705" PRIMARY KEY ("id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "movies" ADD "new_id" SERIAL NOT NULL`);
    await queryRunner.query(`ALTER TABLE "movies" DROP CONSTRAINT "PK_c5b2c134e871bfd1c2fe7cc3705"`);
    await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "movies" RENAME COLUMN "new_id" TO "id"`);
    await queryRunner.query(`ALTER TABLE "movies" ADD CONSTRAINT "PK_c5b2c134e871bfd1c2fe7cc3705" PRIMARY KEY ("id")`);
  }
}
