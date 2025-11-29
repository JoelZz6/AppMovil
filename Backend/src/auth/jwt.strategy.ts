// src/auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'mi_secreto_super_secreto_cambia_esto_en_produccion',
    });
  }

  // ¡IMPORTANTE! Aquí devuelves TODO lo que necesitas en req.user
  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || ['cliente'],        // ← ahora sí vienen los roles
      businessDbName: payload.businessDbName,     // ← crucial para multi-tenant
    };
  }
}