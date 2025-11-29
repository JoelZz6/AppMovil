// business/business.controller.ts
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @Post()
  async create(@Body() dto: CreateBusinessDto, @Req() req) {
    const result = await this.businessService.createBusiness(dto, req.user);

  // FORZAMOS que siempre devuelva el usuario actualizado
  return {
    message: result.message,
    business: result.business,
    user: result.user || {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      roles: req.user.roles,
      businessDbName: req.user.businessDbName,
    },
  };
  }

  @Post('my')
  async getMyBusiness(@Req() req) {
    return this.businessService.getMyBusiness(req.user);
  }
}