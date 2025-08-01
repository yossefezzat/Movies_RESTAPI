import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Genre } from './genre.entity';
import { Rating } from './rating.entity';
import { Watchlist } from '../../watchlist/entities/watchlist.entity';

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  overview: string;

  @Column({ name: 'release_date', type: 'date', nullable: true })
  releaseDate: Date;

  @Column({ name: 'poster_path', type: 'varchar', length: 500, nullable: true })
  posterPath: string;

  @Column({ name: 'backdrop_path', type: 'varchar', length: 500, nullable: true })
  backdropPath: string;

  @Column({ name: 'vote_average', type: 'decimal', precision: 3, scale: 1, default: 0 })
  voteAverage: number;

  @Column({ name: 'vote_count', type: 'integer', default: 0 })
  voteCount: number;

  @Column({ type: 'decimal', precision: 8, scale: 3, default: 0 })
  popularity: number;

  @Column({ name: 'tmdb_id', type: 'integer', unique: true, nullable: true })
  tmdbId: number;

  @Column({ name: 'average_rating', type: 'decimal', precision: 10, scale: 1, nullable: true })
  averageRating: number;

  @Column({ name: 'rating_count', type: 'integer', default: 0 })
  ratingCount: number;

  @ManyToMany(() => Genre)
  @JoinTable({
    name: 'movie_genres_genre',
    joinColumn: {
      name: 'movieId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'genreId',
      referencedColumnName: 'id',
    },
  })
  genres: Genre[];

  @OneToMany(() => Rating, (rating) => rating.movie)
  ratings: Rating[];

  @OneToMany(() => Watchlist, (watchlist) => watchlist.movie)
  watchlistedByUsers: Watchlist[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
