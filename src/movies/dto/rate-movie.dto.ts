import { IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RateMovieDto {
  @ApiProperty({
    description: 'Movie rating from 1.0 to 10.0',
    example: 8.5,
    minimum: 1.0,
    maximum: 10.0,
    type: 'number',
  })
  @IsNumber({ maxDecimalPlaces: 1 }, { message: 'Rating must be a number with at most 1 decimal place' })
  @Min(1.0, { message: 'Rating must be at least 1.0' })
  @Max(10.0, { message: 'Rating must be at most 10.0' })
  @Type(() => Number)
  rating: number;
}
