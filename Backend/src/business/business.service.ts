// src/business/business.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Business } from './entities/business.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateBusinessDto } from './dto/create-business.dto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private businessRepo: Repository<Business>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private mainDataSource: DataSource, // Esta es la conexión principal (a la DB de usuarios)
  ) {}

  async createBusiness(dto: CreateBusinessDto, user: User) {
    if (user.businessDbName) {
      throw new ConflictException('Ya tienes un negocio registrado');
    }

    const dbName = `db_${user.id}`;

    // 1. Crear la base de datos
    await this.mainDataSource.query(`CREATE DATABASE "${dbName}"`);

    // 2. Conectar a la nueva base de datos
    const businessDataSource = await new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'admin',        // ← Cambia por tu usuario de PostgreSQL
      password: 'password',     // ← Cambia por tu contraseña
      database: dbName,
    }).initialize();

    try {
      // 3. Script SQL: crear tabla products
      const createProductsTable = `
        CREATE TABLE product (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          stock INTEGER DEFAULT 0,
          image_url TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Índices útiles
        CREATE INDEX idx_product_name ON product(name);
        CREATE INDEX idx_product_active ON product(is_active);
      `;

      await businessDataSource.query(createProductsTable);

      // Puedes añadir más tablas aquí en el futuro:
      // await businessDataSource.query(createCategoriesTable);
      // await businessDataSource.query(createOrdersTable);

      console.log(`Tablas creadas exitosamente en ${dbName}`);
    } catch (error) {
      console.error('Error creando tablas:', error);
      // Si falla, eliminamos la base de datos para no dejar basura
      await this.mainDataSource.query(`DROP DATABASE IF EXISTS "${dbName}"`);
      throw new ConflictException('Error al inicializar el negocio');
    } finally {
      // Siempre cerramos la conexión
      await businessDataSource.destroy();
    }

    // 4. Guardar el negocio en la DB principal
    const business = this.businessRepo.create({
      ...dto,
      dbName,
      ownerId: user.id,
    });
    await this.businessRepo.save(business);

    // 5. Actualizar usuario
    user.roles = [...new Set([...user.roles, UserRole.GERENTE_NEGOCIO, UserRole.EMPLEADO])];
    user.businessDbName = dbName;
    await this.userRepo.save(user);

    return {
      message: 'Negocio creado con éxito y tablas inicializadas',
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