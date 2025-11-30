import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BusinessModule } from './business/business.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'admin',  // Del docker-compose
      password: 'password',
      database: 'AppMovil',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,  // Solo para dev, no en prod
    }),
    UsersModule,
    AuthModule,
    BusinessModule,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}