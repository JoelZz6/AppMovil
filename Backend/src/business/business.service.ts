// src/business/business.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { DataSource } from 'typeorm';
import { CreateBusinessDto } from './dto/create-business.dto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private businessRepo: Repository<Business>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async createBusiness(dto: CreateBusinessDto, user: User) {
    // 1. Verificar que no tenga negocio ya
    if (user.businessDbName) {
      throw new ConflictException('Ya tienes un negocio registrado');
    }

    const dbName = `db_${user.id}`; // Perfecto: único, seguro y limpio

    // 3. Crear la nueva base de datos (sin validación redundante)
    await this.dataSource.query(`CREATE DATABASE "${dbName}"`);

    // 4. Crear registro del negocio
    const business = this.businessRepo.create({
      ...dto,
      dbName,
      ownerId: user.id,
    });
    await this.businessRepo.save(business);

    // 5. Actualizar usuario: agregar roles + nombre de DB
    user.roles = [...new Set([...user.roles, UserRole.GERENTE_NEGOCIO, UserRole.EMPLEADO])];
    user.businessDbName = dbName;
    await this.userRepo.save(user);

    return {
      message: 'Negocio creado con éxito',
      business,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        businessDbName: user.businessDbName,
      },
    };
  }

  async getMyBusiness(user: User) {
    if (!user.businessDbName) return null;
    return this.businessRepo.findOne({ where: { ownerId: user.id } });
  }
}