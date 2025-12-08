// src/products/dto/register-sale.dto.ts
import { IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class RegisterSaleDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  exit_price: number;

  @IsOptional()
  @IsString()
  notes?: string;
}