import { Controller, Get, Post, Body, Patch, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUser } from 'src/auth/Decorators/GetSomething';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}


  @Get()
  async findOne(@GetUser('id') userId: string) {
    console.log("User ID:", userId);
    return await this.usersService.findOne(userId);
  }

  @Patch()
  async update(@GetUser('id') userId: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.update(userId, updateUserDto);
  }

  @Delete()
  async remove(@GetUser('id') userId: string) {
    return await this.usersService.remove(userId);
  }
}
