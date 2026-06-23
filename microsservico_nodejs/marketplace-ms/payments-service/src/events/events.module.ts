import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';
import { ConfigModule } from '@nestjs/config';
import { PaymentQueueService } from './payment-queue/payment-queue.service';
import { PaymentConsumerService } from './payment-consumer/payment-consumer.service';
import { DlqController } from './dlq/dlq.controller';
import { DlqService } from './dlq/dlq.service';
import { MetricsController } from './metrics/metrics.controller';
import { PaymentsModule } from '../payments/payments.module';
import { PaymentResultPublisherService } from './payment-result/payment-result-publisher.service';

@Module({
  imports: [ConfigModule, PaymentsModule],
  controllers: [DlqController, MetricsController],
  providers: [
    RabbitMQService,
    PaymentQueueService,
    PaymentConsumerService,
    DlqService,
    PaymentResultPublisherService,
  ],
  exports: [RabbitMQService],
})
export class EventsModule {}
