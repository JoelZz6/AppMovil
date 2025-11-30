// src/products/products.controller.ts
import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import type { CreateProductDto } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  async create(@Body() dto: CreateProductDto, @Req() req) {
    const dbName = req.user.businessDbName;
    if (!dbName) throw new Error('No tienes negocio');
    return this.productsService.createProduct(dto, dbName);
  }

  @Get()
  async findAll(@Req() req) {
    const dbName = req.user.businessDbName;
    if (!dbName) return [];
    return this.productsService.getProducts(dbName);
  }
}