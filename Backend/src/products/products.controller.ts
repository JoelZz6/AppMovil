// src/products/products.controller.ts
import { Controller, Post, Body, Get, Req, UseGuards, Patch, Delete, Param, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import type { CreateProductDto } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from 'src/auth/public.decorator';

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

  @Patch(':id')
  async update(@Param('id') id: number, @Body() dto: CreateProductDto, @Req() req) {
    const dbName = req.user.businessDbName;
    if (!dbName) throw new BadRequestException('No tienes negocio');
    return this.productsService.updateProduct(+id, dto, dbName);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Req() req) {
    const dbName = req.user.businessDbName;
    if (!dbName) throw new BadRequestException('No tienes negocio');
    return this.productsService.deleteProduct(+id, dbName);
  }

  @Post('sale')
  async sale(@Body() body: { productId: number; quantity: number; notes?: string },@Req() req,) {
    const dbName = req.user.businessDbName;
    if (!dbName) throw new BadRequestException('No tienes negocio');
    return this.productsService.registerSale(body.productId,body.quantity,dbName,body.notes);
  }

  @Get('history')
  async history(@Req() req) {
    const dbName = req.user.businessDbName;
    if (!dbName) throw new BadRequestException('No tienes negocio');
    return this.productsService.getSalesHistory(dbName);
  }

  @Get('public/all-random')
  @Public()
async getAllProductsFromAllBusinesses() {
  return this.productsService.getAllProductsFromAllBusinesses();
}

@Get('public/business/:dbName')
@Public()
async getBusinessProducts(@Param('dbName') dbName: string) {
  return this.productsService.getBusinessPublicProducts(dbName);
}
}