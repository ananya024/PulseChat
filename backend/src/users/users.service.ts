// users.service.ts

import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ){}

  async create(createUserDto: CreateUserDto) {
    try{
      const hashedPassword= await bcrypt.hash(createUserDto.password,10,);
      createUserDto.password=hashedPassword;
      const newUser= this.userRepository.create(createUserDto);
      return await this.userRepository.save(newUser);
    }
    catch(e){
      throw new ConflictException("User exists");
    }
  }

  findAll() {
    return this.userRepository.find();
  }

  findOneByUname(username: string) {
    return this.userRepository.findOneBy({username:username});
  }

  findOneById(userId: string) {
    return this.userRepository.findOneBy({userId:userId});
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.userRepository.update({userId:id}, updateUserDto)
  }

  remove(id: string) {
    this.userRepository.softDelete({userId:id})
    return "deleted";
  }

  async authUser(username: string, password:string){
    const user= await this.userRepository.findOneBy({username:username})
    if(!user)
      return null;
    const valid = await bcrypt.compare(password, user.password);
    if(valid)
      return user;
    else
      return null;
  }
}
