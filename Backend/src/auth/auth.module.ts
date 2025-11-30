// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';   // ← AÑADIR

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      //global: true,  //TAMBIEN FUNCIONA VUELVE GLOBAL ESTE Jwt PARA FIRMAS JWT, SIN ESTO TENDREMOS QUE IMPORTAR ESTE JWT EN 
      //DONDE QUERRAMOS REALIZAR LAS FIRMAS
      secret: 'mi_secreto_super_secreto_cambia_esto_en_produccion',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, JwtModule],   // ← EXPORTAR EL GUARD
})
export class AuthModule {}