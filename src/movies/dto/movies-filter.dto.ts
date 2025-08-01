import { IsOptional, IsArray, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class MoviesFilterDto extends PaginationDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((genre) => genre.trim());
    }
    return value;
  })
  @Type(() => String)
  genres?: string[];
}
