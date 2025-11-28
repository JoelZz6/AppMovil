import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, name } = createUserDto;
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email ya existe');
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = this.usersRepository.create({ email, password: hashedPassword, name, role: UserRole.CLIENTE, });
    return this.usersRepository.save(user);
  }
  
  async findByEmail(email: string): Promise<User | null> {
  return this.usersRepository.findOne({ where: { email } });
}

// Opcional: método para buscar por ID (UUID)
  async findById(id: string): Promise<User | null> {
  return this.usersRepository.findOne({ where: { id } });
  }
}