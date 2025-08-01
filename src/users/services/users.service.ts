import { Injectable, ConflictException, UnauthorizedException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject('ACCESS_TOKEN_JWT_SERVICE')
    private readonly accessTokenJwtService: JwtService,
    @Inject('REFRESH_TOKEN_JWT_SERVICE')
    private readonly refreshTokenJwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { username, password, fullName } = createUserDto;

    const existingUser = await this.userRepository.findOne({ where: { username } });
    if (existingUser) {
      throw new ConflictException('User with this username already exists');
    }

    const hashedPassword = await this.hashPassword(password);
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      fullName,
    });
    const savedUser = await this.userRepository.save(user);
    return this.transformUserToResponse(savedUser);
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;
    const user = await this.findByUsername(username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    await this.userRepository.update(user.id, { refreshToken: tokens.refresh_token });

    return {
      ...tokens,
      user: this.transformUserToResponse(user),
    };
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refreshToken: null });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, refreshToken },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    await this.userRepository.update(user.id, { refreshToken: tokens.refresh_token });

    return tokens;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('bcrypt.saltRounds', 10);
    return bcrypt.hash(password, saltRounds);
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.accessTokenJwtService.sign(payload),
      refresh_token: this.refreshTokenJwtService.sign(payload),
    };
  }

  private transformUserToResponse(user: User): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
    });
  }
}
