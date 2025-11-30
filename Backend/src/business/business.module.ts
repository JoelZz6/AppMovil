import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './entities/business.entity';
import { User } from '../users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt'; // ← AÑADE ESTO
@Module({
  imports: [
    TypeOrmModule.forFeature([Business, User]),JwtModule.register({
      secret: 'mi_secreto_super_secreto_cambia_esto_en_produccion',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [BusinessController],
  providers: [BusinessService],
})
export class BusinessModule {}