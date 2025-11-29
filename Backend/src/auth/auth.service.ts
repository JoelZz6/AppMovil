import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  // En tu auth.service.ts, cambia el login así:
async login(user: any) {
  const payload = {
    email: user.email,
    sub: user.id,
    roles: user.roles,           // ← enviamos roles
    businessDbName: user.businessDbName, // ← enviamos nombre de la DB
  };

  return {
    access_token: this.jwtService.sign(payload),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      businessDbName: user.businessDbName,
    },
  };
}
}