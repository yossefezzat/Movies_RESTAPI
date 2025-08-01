import { MigrationInterface, QueryRunner } from 'typeorm';

export class MovieRatingTable1754080784013 implements MigrationInterface {
  name = 'MovieRatingTable1754080784013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ratings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "movieId" uuid NOT NULL, "rating" numeric(3,1) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_116588721ee67dd5ad6c79a9334" UNIQUE ("userId", "movieId"), CONSTRAINT "PK_0f31425b073219379545ad68ed9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" ADD CONSTRAINT "FK_4d0b0e3a4c4af854d225154ba40" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" ADD CONSTRAINT "FK_c10d219b6360c74a9f2186b76df" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ratings" DROP CONSTRAINT "FK_c10d219b6360c74a9f2186b76df"`);
    await queryRunner.query(`ALTER TABLE "ratings" DROP CONSTRAINT "FK_4d0b0e3a4c4af854d225154ba40"`);
    await queryRunner.query(`DROP TABLE "ratings"`);
  }
}
