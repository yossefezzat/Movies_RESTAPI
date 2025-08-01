import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserWatchlist1754089656325 implements MigrationInterface {
  name = 'UserWatchlist1754089656325';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_watchlist_movies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "movieId" uuid, CONSTRAINT "PK_05ea81a2207986560888ab4431a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_watchlist_movies" ADD CONSTRAINT "FK_9902e06372eaf0ba5c9cf4698a7" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_watchlist_movies" ADD CONSTRAINT "FK_c16356a4f4e9a79f93fdfa1ddfc" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_watchlist_movies" DROP CONSTRAINT "FK_c16356a4f4e9a79f93fdfa1ddfc"`);
    await queryRunner.query(`ALTER TABLE "user_watchlist_movies" DROP CONSTRAINT "FK_9902e06372eaf0ba5c9cf4698a7"`);
    await queryRunner.query(`DROP TABLE "user_watchlist_movies"`);
  }
}
