import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1753995146707 implements MigrationInterface {
  name = 'Migration1753995146707';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "movie_genres_genre" DROP CONSTRAINT "FK_movie_genres_movieId"`);
    await queryRunner.query(`ALTER TABLE "movie_genres_genre" DROP CONSTRAINT "FK_movie_genres_genreId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_movie_genres_movieId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_movie_genres_genreId"`);
    await queryRunner.query(`CREATE INDEX "IDX_985216b45541c7e0ec644a8dd4" ON "movie_genres_genre" ("movieId") `);
    await queryRunner.query(`CREATE INDEX "IDX_1996ce31a9e067304ab168d671" ON "movie_genres_genre" ("genreId") `);
    await queryRunner.query(
      `ALTER TABLE "movie_genres_genre" ADD CONSTRAINT "FK_985216b45541c7e0ec644a8dd4e" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "movie_genres_genre" ADD CONSTRAINT "FK_1996ce31a9e067304ab168d6715" FOREIGN KEY ("genreId") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "movie_genres_genre" DROP CONSTRAINT "FK_1996ce31a9e067304ab168d6715"`);
    await queryRunner.query(`ALTER TABLE "movie_genres_genre" DROP CONSTRAINT "FK_985216b45541c7e0ec644a8dd4e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1996ce31a9e067304ab168d671"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_985216b45541c7e0ec644a8dd4"`);
    await queryRunner.query(`CREATE INDEX "IDX_movie_genres_genreId" ON "movie_genres_genre" ("genreId") `);
    await queryRunner.query(`CREATE INDEX "IDX_movie_genres_movieId" ON "movie_genres_genre" ("movieId") `);
    await queryRunner.query(
      `ALTER TABLE "movie_genres_genre" ADD CONSTRAINT "FK_movie_genres_genreId" FOREIGN KEY ("genreId") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "movie_genres_genre" ADD CONSTRAINT "FK_movie_genres_movieId" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }
}
