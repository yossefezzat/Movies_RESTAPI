import { IsNotEmpty, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class SearchMoviesDto extends PaginationDto {
  @IsNotEmpty()
  @IsString()
  query: string;
}
