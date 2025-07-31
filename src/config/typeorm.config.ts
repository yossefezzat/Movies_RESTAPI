import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { Genre } from 'src/movies/entities/genre.entity';
import { Movie } from 'src/movies/entities/movie.entity';

config({ path: process.cwd() + '/.env' });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [Movie, Genre],
  migrations: [join(__dirname, '..', 'database', 'migrations', '*.js')],
  synchronize: false,
  migrationsRun: true,
  migrationsTransactionMode: 'each',
  migrationsTableName: 'migrations',
});

export default AppDataSource;
