import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { ProxyService } from '../../proxy/service/proxy.service';
import {
  ApiOperation,
  ApiResponse,
  ApiResponseProperty,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from '../service/auth.service';
import { Throttle } from '@nestjs/throttler';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly proxyService: ProxyService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login do usuário',
    description: 'Autentica um usuário e retorna JWT token e session token',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        user: { type: 'object' },
        accessToken: { type: 'string' },
        sessionToken: { type: 'string' },
        expiresIn: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registro de usuário',
    description: 'Cria uma nova conta de usuário no sistema',
  })
  @ApiResponse({ status: 201, description: 'Usuario registrado com sucesso!' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  @Throttle({ medium: { limit: 3, ttl: 60000 } })
  async register(@Body() regiserDto: RegisterDto) {
    return this.authService.register(regiserDto);
  }

  @Get('validate-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Validação de token',
    description: 'Valida um JWT token e retorna os dados do usuário associado',
  })
  @ApiResponse({ status: 200, description: 'Token válido' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async validateToken(@Req() req: Request) {
    const authHeader = req.headers['authorization'] as string;
    return this.proxyService.proxyRequest(
      'users',
      'GET',
      '/auth/validate-token',
      undefined,
      { authorization: authHeader },
    );
  }
}
