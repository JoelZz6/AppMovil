// src/products/products.controller.ts
import { Controller, Post, Body, Get, Req, UseGuards, Patch, Delete, Param, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from 'src/auth/public.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AddLotDto } from './dto/add-lot.dto';
import { RegisterSaleDto } from './dto/register-sale.dto';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
async create(@Body() dto: CreateProductDto, @Req() req) {
  return this.productsService.createProduct(dto, req.user.businessDbName);
}

  @Get()
  async findAll(@Req() req) {
    const dbName = req.user.businessDbName;
    if (!dbName) return [];
    return this.productsService.getProducts(dbName);
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateProductDto, @Req() req) {
    return this.productsService.updateProduct(+id, dto, req.user.businessDbName);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Req() req) {
    const dbName = req.user.businessDbName;
    if (!dbName) throw new BadRequestException('No tienes negocio');
    return this.productsService.deleteProduct(+id, dbName);
  }

  @Post('sale')
async sale(@Body() dto: RegisterSaleDto, @Req() req) {
  return this.productsService.registerSale(dto, req.user.businessDbName);
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

// PARA CHAT IA
@Get('ai/catalog')
@Public()
async getFullCatalogForAI() {
  return this.productsService.getFullCatalogForAI();
}
@Post('lot')
async addLot(@Body() dto: AddLotDto, @Req() req) {
  return this.productsService.addLot(dto, req.user.businessDbName);
}
}