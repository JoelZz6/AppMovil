// business/dto/create-business.dto.ts
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  description: string;

  @IsString()
  phone: string;

  @IsString()
  address: string;
}