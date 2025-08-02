import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { Genre } from '../movies/entities/genre.entity';
import { Movie } from '../movies/entities/movie.entity';
import { Rating } from '../movies/entities/rating.entity';
import { User } from '../users/entities/user.entity';
import { Watchlist } from '../watchlist/entities/watchlist.entity';

config({ path: process.cwd() + '/.env' });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [Movie, Genre, Rating, User, Watchlist],
  migrations: [join(__dirname, '..', 'database', 'migrations', '*.js')],
  synchronize: false,
  migrationsRun: true,
  migrationsTransactionMode: 'each',
  migrationsTableName: 'migrations',
});

export default AppDataSource;
