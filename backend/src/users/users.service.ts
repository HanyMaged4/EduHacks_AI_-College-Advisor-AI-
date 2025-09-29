import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {

  findOne() {
    // return `This action returns a #${id} user`;
  }

  update(updateUserDto: UpdateUserDto) {
    // return `This action updates a #${id} user`;
  }

  remove() {
    // return `This action removes a #${id} user`;
  }
}
