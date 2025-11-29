import { Entity, PrimaryColumn, Column, BeforeInsert, CreateDateColumn, UpdateDateColumn, } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum UserRole {
  CLIENTE = 'cliente',
  GERENTE_NEGOCIO = 'GerenteNegocio',
  EMPLEADO = 'Empleado',
}

@Entity()
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: [UserRole.CLIENTE],
    array: true,
  })
  roles: UserRole[];

  @Column({ nullable: true })
  businessDbName?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Generar UUID automáticamente antes de insertar
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
  @BeforeInsert()
  ensureRolesArray() {
    if (!this.roles || this.roles.length === 0) {
      this.roles = [UserRole.CLIENTE];
    }
  }
}