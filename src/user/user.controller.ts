import {
  Body,
  Controller,
  Get,
  Injectable,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { User } from '@prisma/client';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { UserService } from './user.service';
import { EditUserDto } from './dto/edit-user.dto';

@UseGuards(JwtGuard)
@Controller('users')
@Injectable()
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  getMe(@GetUser() user: User) {
    return user;
  }

  @Patch()
  async editUser(
    @GetUser('id') userId: number,
    @Body() dto: EditUserDto,
  ) {
    console.log(
      '🚀 ~ file: user.controller.ts:32 ~ UserController ~ dto:',
      dto,
    );
    return this.userService.editUser(userId, dto);
  }
}
