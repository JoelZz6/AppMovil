// src/products/dto/add-lot.dto.ts
import { IsNumber, Min } from 'class-validator';

export class AddLotDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  @Min(0)
  entry_price: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}