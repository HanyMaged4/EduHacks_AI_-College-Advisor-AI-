import { Injectable, UseGuards } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  
  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
    });
    return user;
  }

  async remove(userId: string) {
    // get user from prisma
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new Error('User not found');
    }
    const deletedUser = this.prisma.user.delete({
      where: { id: userId },
    });
    return true;
  }
}
