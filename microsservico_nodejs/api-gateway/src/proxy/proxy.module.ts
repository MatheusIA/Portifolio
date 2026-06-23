import { Module } from '@nestjs/common';
import { ProxyService } from './service/proxy.service';
import { HttpModule } from '@nestjs/axios';
import { CircuitBreakerModule } from 'src/common/circuit-breaker/circuit-breaker.module';
import { FallbackModule } from 'src/common/fallback/fallback.module';
import { RetryModule } from 'src/common/retry/retry.module';
import { TimeoutModule } from 'src/common/timeout/timeout.module';

@Module({
  imports: [
    HttpModule,
    CircuitBreakerModule,
    FallbackModule,
    TimeoutModule,
    RetryModule,
  ], // O que eu preciso para rodar esse modulo de proxy
  providers: [ProxyService], // O que eu vou exportar do meu modulo, para outros modulos utilizarem
  exports: [ProxyService],
})
export class ProxyModule {}
