// src/products/dto/create-product.dto.ts
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  market_price: number;

  @IsNumber()
  @Min(0)
  initial_entry_price: number;

  @IsNumber()
  @Min(1)
  initial_quantity: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}