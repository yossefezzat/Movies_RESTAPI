import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1753916306960 implements MigrationInterface {
  name = 'Migration1753916306960';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "movies" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "overview" text, "release_date" date, "poster_path" character varying(500), "backdrop_path" character varying(500), "vote_average" numeric(3,1) NOT NULL DEFAULT '0', "vote_count" integer NOT NULL DEFAULT '0', "popularity" numeric(8,3) NOT NULL DEFAULT '0', "genre_ids" jsonb, "tmdb_id" integer, "average_rating" numeric(10,1), "rating_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a30f596bb8c7b8213cec64c5125" UNIQUE ("tmdb_id"), CONSTRAINT "PK_c5b2c134e871bfd1c2fe7cc3705" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "genres" ("id" integer NOT NULL, "name" character varying(100) NOT NULL, CONSTRAINT "UQ_f105f8230a83b86a346427de94d" UNIQUE ("name"), CONSTRAINT "PK_80ecd718f0f00dde5d77a9be842" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "genres"`);
    await queryRunner.query(`DROP TABLE "movies"`);
  }
}
