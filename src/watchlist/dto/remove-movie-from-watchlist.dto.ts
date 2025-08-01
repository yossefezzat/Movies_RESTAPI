import { IsUUID, IsNotEmpty } from 'class-validator';

export class RemoveMovieFromWatchlistDto {
  @IsUUID()
  @IsNotEmpty()
  movieId: string;
}
