import { IsUUID, IsNotEmpty } from 'class-validator';

export class AddMovieToWatchlistDto {
  @IsUUID()
  @IsNotEmpty()
  movieId: string;
}
