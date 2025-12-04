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

  async getAllProductsFromAllBusinesses() {
  // 1. Traer todos los negocios con su nombre desde la DB principal
  const businesses = await this.mainDataSource.query(`
    SELECT "dbName", name AS business_name 
    FROM business 
    WHERE "dbName" IS NOT NULL AND "dbName" != ''
  `);

  if (businesses.length === 0) return [];

  const allProducts: any[] = [];

  // 2. Recorrer cada negocio
  for (const business of businesses) {
    const { dbName, business_name } = business;

    let businessDs;
    try {
      businessDs = await this.getBusinessDataSource(dbName);

      // 3. Traer productos de ESTE negocio
      const products = await businessDs.query(`
        SELECT 
          id, name, description, price, stock, image_url, created_at
        FROM product 
        WHERE stock > 0 OR stock IS NULL
        ORDER BY RANDOM()
        LIMIT 15
      `);

      // 4. Añadir el nombre del negocio a cada producto
      products.forEach((p: any) => {
        p.business_name = business_name || 'Tienda';
        p.business_db = dbName; // opcional: para futuro
      });

      allProducts.push(...products);
    } catch (error) {
      console.log(`Error conectando a ${dbName}:`, error.message);
      // Si una DB falla, seguimos con las demás
    } finally {
      if (businessDs) await businessDs.destroy();
    }
  }

  // 5. Mezclar todo aleatoriamente
  return allProducts.sort(() => Math.random() - 0.5);
}

async getBusinessPublicProducts(dbName: string) {
  const businessDs = await this.getBusinessDataSource(dbName);
  try {
    return await businessDs.query(`
      SELECT id, name, price, image_url, stock, description 
      FROM product 
      WHERE stock > 0 OR stock IS NULL
      ORDER BY created_at DESC
    `);
  } finally {
    await businessDs.destroy();
  }
}
//PARA CHAT IA
async getFullCatalogForAI() {
  const businesses = await this.mainDataSource.query(`
    SELECT "dbName", name as business_name, phone 
    FROM business 
    WHERE "dbName" IS NOT NULL
  `);

  const catalog: any[] = [];

  for (const business of businesses) {
    const { dbName, business_name, phone } = business;
    let ds;
    try {
      ds = await this.getBusinessDataSource(dbName);

      const products = await ds.query(`
        SELECT 
          name,
          description,
          price::text as price,
          stock,
          image_url
        FROM product 
        WHERE stock > 0 OR stock IS NULL
      `);

      products.forEach((p: any) => {
        catalog.push({
          business_name,
          business_phone: phone,
          business_db: dbName,
          ...p
        });
      });
    } catch (error) {
      console.log(`No se pudo leer ${dbName}:`, error.message);
    } finally {
      if (ds) await ds.destroy();
    }
  }

  return catalog;
}
}