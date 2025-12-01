// src/products/products.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
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

  async updateProduct(id: number, dto: CreateProductDto, dbName: string) {
    const businessDs = await this.getBusinessDataSource(dbName);
    try {
      const result = await businessDs.query(
        `UPDATE product 
        SET name = $1, description = $2, price = $3, stock = $4, image_url = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *`,
        [dto.name, dto.description || null, dto.price, dto.stock || 0, dto.imageUrl || null, id],
      );
      return result[0];
    } finally {
      await businessDs.destroy();
    }
  }

  async deleteProduct(id: number, dbName: string) {
    const businessDs = await this.getBusinessDataSource(dbName);
    try {
      await businessDs.query(`DELETE FROM product WHERE id = $1`, [id]);
      return { success: true };
    } finally {
      await businessDs.destroy();
    }
  }

  async registerSale(productId: number, quantity: number, dbName: string, notes?: string) {
  const businessDs = await this.getBusinessDataSource(dbName);
  try {
    await businessDs.query(
      `INSERT INTO sale (product_id, quantity, notes) 
       VALUES ($1, $2, $3)`,
      [productId, quantity, notes || null]
    );

    const result = await businessDs.query(
      `UPDATE product SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING stock`,
      [quantity, productId]
    );

    if (result.rowCount === 0) throw new BadRequestException('Stock insuficiente');

    return { success: true };
  } finally {
    await businessDs.destroy();
  }
}

  async getSalesHistory(dbName: string) {
    const businessDs = await this.getBusinessDataSource(dbName);
    try {
      const sales = await businessDs.query(`
        SELECT s.*, p.name as product_name 
        FROM sale s 
        JOIN product p ON s.product_id = p.id 
        ORDER BY s.created_at DESC
      `);
      return sales;
    } finally {
      await businessDs.destroy();
    }
  }
}