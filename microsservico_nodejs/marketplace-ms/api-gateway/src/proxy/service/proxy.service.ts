import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CircuitBreakerService } from 'src/common/circuit-breaker/circuit-breaker.service';
import { CacheFallbackService } from 'src/common/fallback/cache.fallback';
import { DefaultFallbackService } from 'src/common/fallback/default.fallback';
import { RetryService } from 'src/common/retry/retry.service';
import { TimeoutService } from 'src/common/timeout/timeout.service';
import { serviceConfig } from 'src/config/gateway.config';

interface UserInfo {
  sub: string;
  userId: string;
  email: string;
  role: string;
}

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly cacheFallbackService: CacheFallbackService,
    private readonly defaultFallbackService: DefaultFallbackService,
    private readonly timeoutService: TimeoutService,
    private readonly retryService: RetryService,
  ) {}

  async proxyRequest(
    serviceName: keyof typeof serviceConfig,
    method: string,
    path: string,
    data?: unknown,
    headers?: Record<string, string>,
    userInfo?: UserInfo,
  ) {
    const service = serviceConfig[serviceName];
    const url = `${service.url}${path}`;

    this.logger.log(`Proxying ${method} request to ${serviceName}: ${url}`);

    const fallback = this.createServiceFallback(serviceName, method, path);

    // Camada 1: Circuit Breaker
    return this.circuitBreakerService.executeWithCircuitBreaker(
      async () => {
        //Camada 2: Retry
        return await this.retryService.executeWithExponentialBackoff(
          async () => {
            // Camada 3: TIMEOUT
            return await this.timeoutService.executeWithCustomTimeout(
              async () => {
                const enhancedHeaders = {
                  ...headers,
                  'x-user-id': userInfo?.sub,
                  'x-user-email': userInfo?.email,
                  'x-user-role': userInfo?.role,
                };

                const response = await firstValueFrom(
                  this.httpService.request({
                    method: method.toLowerCase() as HttpMethod,
                    url,
                    data,
                    headers: enhancedHeaders,
                    timeout: service.timeout,
                    validateStatus: () => true,
                  }),
                );

                if (response.status >= 400 && response.status < 500) {
                  throw new HttpException(response.data, response.status);
                }

                if (response.status >= 500) {
                  throw new Error(
                    `Upstream ${serviceName} returned ${response.status}`,
                  );
                }

                if (method.toLowerCase() === 'get') {
                  this.cacheFallbackService.setCachedData(
                    `${serviceName}-${path}`,
                    response.data,
                  );
                }

                return response.data;
              },
              service.timeout,
            );
          },
          4,
        );
      },
      `proxy-${serviceName}`,
      fallback,
      { failureThreshold: 3, timeout: 30000, resetTimeout: 30000 },
    );
  }

  private createServiceFallback(
    serviceName: string,
    method: string,
    path: string,
  ) {
    switch (serviceName) {
      case 'users':
        if (path.includes('/auth/login')) {
          return this.defaultFallbackService.createErrorFallback(
            'users',
            'Authentication service unavailable',
          );
        }
        return this.defaultFallbackService.createErrorFallback(
          'users',
          'User service unavailable',
        );
      case 'products':
        if (method.toLowerCase() === 'get') {
          return this.cacheFallbackService.createCacheFallback(
            `products-${path}`,
            { products: [], total: 0, page: 1, limit: 10 },
          );
        }
        return this.defaultFallbackService.createErrorFallback(
          'products',
          'Products service unavailable',
        );
      case 'checkout':
      case 'payments':
        return this.defaultFallbackService.createErrorFallback(
          serviceName,
          `${serviceName} service unavailable`,
        );
      default:
        return this.defaultFallbackService.createErrorFallback(
          serviceName,
          'Service unavailable',
        );
    }
  }
}
