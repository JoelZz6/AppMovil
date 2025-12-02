// src/business/business.controller.ts
import { Controller, Post, Body, Req, UseGuards, Get, Param } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt'; // ← AÑADE ESTO
import { Public } from 'src/auth/public.decorator';

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(
    private businessService: BusinessService,
    private jwtService: JwtService, // ← Inyecta JwtService
  ) {}

  @Post()
  async create(@Body() dto: CreateBusinessDto, @Req() req) {
    const result = await this.businessService.createBusiness(dto, req.user);

    // Generamos un NUEVO token con los datos actualizados
    const payload = {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      roles: result.user.roles,
      businessDbName: result.user.businessDbName, // ← ahora SÍ tiene valor
    };
    const newToken = this.jwtService.sign(payload);

    return {
      message: result.message,
      business: result.business,
      user: result.user,
      token: newToken, // ← ¡¡ESTO ES LA CLAVE!!
    };
  }

  @Post('my')
  async getMyBusiness(@Req() req) {
    return this.businessService.getMyBusiness(req.user);
  }

  @Get('public/:dbName')
@Public()
async getPublicBusiness(@Param('dbName') dbName: string) {
  return this.businessService.getPublicInfo(dbName);
}
}