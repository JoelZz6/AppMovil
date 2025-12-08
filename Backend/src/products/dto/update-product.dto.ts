// src/products/dto/update-product.dto.ts
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  market_price?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}