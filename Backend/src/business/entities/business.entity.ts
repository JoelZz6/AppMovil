// backend/src/business/entities/business.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  category: string; // ej: Restaurante, Tienda, Peluquería

  @Column()
  description: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column()
  ownerId: string; // UUID del usuario

  @Column({ unique: true })
  dbName: string; // ej: db_lanoria

  @CreateDateColumn()
  createdAt: Date;
}