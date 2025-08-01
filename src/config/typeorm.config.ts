import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { Genre } from '../movies/entities/genre.entity';
import { Movie } from '../movies/entities/movie.entity';
import { User } from '../users/entities/user.entity';

config({ path: process.cwd() + '/.env' });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [Movie, Genre, User],
  migrations: [join(__dirname, '..', 'database', 'migrations', '*.ts')],
  synchronize: false,
  migrationsRun: true,
  migrationsTransactionMode: 'each',
  migrationsTableName: 'migrations',
});

export default AppDataSource;
