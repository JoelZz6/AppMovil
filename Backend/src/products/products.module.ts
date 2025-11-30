import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([])], // No necesitamos entidades aquí
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}