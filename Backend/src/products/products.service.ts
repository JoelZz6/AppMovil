// src/products/products.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  imageUrl?: string;
}

@Injectable()
export class ProductsService {
  // Recibe la conexión principal
  constructor(private mainDataSource: DataSource) {}

  // Crea una conexión temporal a la DB del usuario
  private async getBusinessDataSource(dbName: string) {
    return await new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'admin',     // ← Cambia por tu usuario de PostgreSQL
      password: 'password',  // ← Cambia por tu contraseña
      database: dbName,
    }).initialize();
  }

  async createProduct(dto: CreateProductDto, userBusinessDb: string) {
    const businessDs = await this.getBusinessDataSource(userBusinessDb);
    try {
      const result = await businessDs.query(
        `INSERT INTO product (name, description, price, stock, image_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [dto.name, dto.description || null, dto.price, dto.stock || 0, dto.imageUrl || null],
      );
      return result[0];
    } finally {
      await businessDs.destroy();
    }
  }

  async getProducts(userBusinessDb: string) {
    const businessDs = await this.getBusinessDataSource(userBusinessDb);
    try {
      return await businessDs.query(`SELECT * FROM product ORDER BY created_at DESC`);
    } finally {
      await businessDs.destroy();
    }
  }
}