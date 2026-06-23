import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<Pick<JwtService, 'verify'>>;

  beforeEach(async () => {
    jwtService = { verify: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtService },
        { provide: HttpService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateJwtToken', () => {
    it('should return decoded token when valid', () => {
      const decoded = { sub: 'uuid-1', email: 'test@email.com', role: 'buyer' };
      jwtService.verify.mockReturnValue(decoded as any);

      const result = service.validateJwtToken('valid-token');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual(decoded);
    });

    it('should throw UnauthorizedException when token is invalid', () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      expect(() => service.validateJwtToken('bad-token')).toThrow(
        UnauthorizedException,
      );
    });
  });
});
