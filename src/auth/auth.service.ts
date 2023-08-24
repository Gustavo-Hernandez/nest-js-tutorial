import * as argon from 'argon2';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    const hashedPassword = await argon.hash(
      dto.password,
    );
    try {
      const user =
        await this.prismaService.user.create({
          data: {
            email: dto.email,
            hash: hashedPassword,
          },
        });

      return this.signToken(user.id, user.email);
    } catch (error) {
      if (
        error instanceof
        PrismaClientKnownRequestError
      ) {
        if (error.code === 'P2002') {
          throw new ForbiddenException(
            'Email already exists',
          );
        }
      }
      throw error;
    }
  }

  async signin(dto: AuthDto) {
    const user =
      await this.prismaService.user.findUnique({
        where: {
          email: dto.email,
        },
      });

    if (!user) {
      throw new ForbiddenException(
        'Incorrect credentials',
      );
    }

    const isPasswordValid = await argon.verify(
      user.hash,
      dto.password,
    );

    if (!isPasswordValid) {
      throw new ForbiddenException(
        'Incorrect credentials',
      );
    }

    return this.signToken(user.id, user.email);
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const token = await this.jwtService.signAsync(
      payload,
      {
        expiresIn: '15m',
        secret:
          this.configService.get('JWT_SECRET'),
      },
    );

    return {
      access_token: token,
    };
  }
}
