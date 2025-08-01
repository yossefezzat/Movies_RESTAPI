import { Exclude } from 'class-transformer';

export class UserResponseDto {
  id: string;
  username: string;
  fullName: string;

  @Exclude()
  password: string;

  @Exclude()
  refreshToken: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
