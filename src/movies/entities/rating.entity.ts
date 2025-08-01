import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Movie } from './movie.entity';
import { User } from '../../users/entities/user.entity';

@Entity('ratings')
@Unique(['userId', 'movieId'])
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  movieId: string;

  @Column('decimal', { precision: 3, scale: 1 })
  rating: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Movie, (movie) => movie.ratings)
  movie: Movie;
}
