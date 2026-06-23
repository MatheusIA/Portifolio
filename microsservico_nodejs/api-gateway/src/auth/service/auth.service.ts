import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import { serviceConfig } from 'src/config/gateway.config';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
export interface UserSession {
  valid: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
  } | null;
}

export interface AuthResponse {
  access_token: string;
  valid: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService,
  ) {}

  async validateJwtToken(token: string): Promise<AuthResponse> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid JWT Token');
    }
  }

  async validateSessionToken(sessionToken: string): Promise<UserSession> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<UserSession>(
          `
                    ${serviceConfig.users.url}/sessions/validate/${sessionToken}`,
          { timeout: serviceConfig.users.timeout },
        ),
      );

      return data;
    } catch (error) {
      throw new UnauthorizedException('Invalid Session Token');
    }
  }

  async login(loginDTO: LoginDto): Promise<AuthResponse> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${serviceConfig.users.url}/auth/login`,
          loginDTO,
          {
            timeout: serviceConfig.users.timeout,
          },
        ),
      );

      return data;
    } catch (error) {
      throw new UnauthorizedException('Invalid login credentials');
    }
  }

  async register(registerDTO: RegisterDto): Promise<AuthResponse> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${serviceConfig.users.url}/auth/register`,
          registerDTO,
          { timeout: serviceConfig.users.timeout },
        ),
      );

      return data;
    } catch (error) {
      throw new UnauthorizedException('Registration failed');
    }
  }
}
