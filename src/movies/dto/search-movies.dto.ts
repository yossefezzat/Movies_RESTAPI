import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class SearchMoviesDto extends PaginationDto {
  @ApiProperty({
    description: 'Search query for movies (title, genre, etc.)',
    example: 'Inception',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  query: string;
}
