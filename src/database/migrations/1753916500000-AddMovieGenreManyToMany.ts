import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMovieGenreManyToMany1753916500000 implements MigrationInterface {
  name = 'AddMovieGenreManyToMany1753916500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "movie_genres_genre" (
                "movieId" uuid NOT NULL,
                "genreId" integer NOT NULL,
                CONSTRAINT "PK_movie_genres_genre" PRIMARY KEY ("movieId", "genreId")
            )
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_movie_genres_movieId" ON "movie_genres_genre" ("movieId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_movie_genres_genreId" ON "movie_genres_genre" ("genreId")
        `);

    await queryRunner.query(`
            ALTER TABLE "movie_genres_genre" 
            ADD CONSTRAINT "FK_movie_genres_movieId" 
            FOREIGN KEY ("movieId") REFERENCES "movies"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "movie_genres_genre" 
            ADD CONSTRAINT "FK_movie_genres_genreId" 
            FOREIGN KEY ("genreId") REFERENCES "genres"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE
        `);

    await queryRunner.query(`
            ALTER TABLE "movies" DROP COLUMN "genre_ids"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "movies" ADD "genre_ids" jsonb
        `);

    await queryRunner.query(`
            ALTER TABLE "movie_genres_genre" DROP CONSTRAINT "FK_movie_genres_genreId"
        `);
    await queryRunner.query(`
            ALTER TABLE "movie_genres_genre" DROP CONSTRAINT "FK_movie_genres_movieId"
        `);

    await queryRunner.query(`
            DROP INDEX "IDX_movie_genres_genreId"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_movie_genres_movieId"
        `);

    await queryRunner.query(`
            DROP TABLE "movie_genres_genre"
        `);
  }
}
