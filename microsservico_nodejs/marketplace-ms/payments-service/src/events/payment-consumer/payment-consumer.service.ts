import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PaymentQueueService } from '../payment-queue/payment-queue.service';
import { PaymentOrderMessage } from '../payment-queue.interface';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { PaymentsService } from '../../payments/payments.service';
import { PaymentResultPublisherService } from '../payment-result/payment-result-publisher.service';

export interface ConsumerMetrics {
  totalProcessed: number; // Total de mensagens processadas
  totalSuccess: number; // Mensagens processadas com sucesso
  totalFailed: number; // Mensagens que falharam
  totalRetries: number; // Total de tentativas retry
  lastProcessedAt: Date | null; // Data da última mensagem processada
  startedAt: Date; // Data de inicialização do consumer
  averageProcessingTime: number; // Tempo médio de processamento em ms
}
@Injectable()
export class PaymentConsumerService implements OnModuleInit {
  private metrics: ConsumerMetrics = {
    totalProcessed: 0,
    totalSuccess: 0,
    totalFailed: 0,
    totalRetries: 0,
    lastProcessedAt: null,
    startedAt: new Date(),
    averageProcessingTime: 0,
  };

  /**
   * Acumulador para calcular tempo médio de processamento
   * Guardamos a soma total para não precisar armazenar todos os tempos
   */
  private totalProcessingTime = 0;
  private readonly logger = new Logger(PaymentConsumerService.name);

  constructor(
    private readonly paymentQueueService: PaymentQueueService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly paymentsService: PaymentsService,
    private readonly paymentResultPublisher: PaymentResultPublisherService,
  ) {}

  // Clase padrão do Nest para inicialização,
  // Garante que o serviço só será iniciado após a inicialização do módulo
  async onModuleInit() {
    this.logger.log('Starting Payment Consumer Service');
    this.metrics.startedAt = new Date();

    await this.startConsuming();
  }

  async startConsuming() {
    try {
      this.logger.log('Starting to consume payment orders from queue');

      const isConnected = await this.rabbitMQService.waitForConnection();

      if (!isConnected) {
        this.logger.error(
          'Could not connect to RabbitMQ after multiple attempts',
        );
        return;
      }

      // Registra callback para processar cada mensagem
      // O bind() é utilizado para garantir que o this dentro do callback seja esta classe
      await this.paymentQueueService.consumePaymentOrders(
        this.processPaymentOrder.bind(this),
      );

      this.logger.log('Payment Consumer Service started successfully');
    } catch (error) {
      this.logger.error('Failed to start consuming payment orders: ', error);
    }
  }

  private async processPaymentOrder(
    message: PaymentOrderMessage,
  ): Promise<void> {
    const startTime = Date.now();
    try {
      if (!this.validateMessage(message)) {
        this.logger.error('❌ Invalid payment message received');
        throw new Error('Invalid payment message received');
      }

      const payment = await this.paymentsService.processPayment(message);

      try {
        await this.paymentResultPublisher.publishPaymentResult(payment);
      } catch (publishError) {
        this.logger.error(
          `⚠️ Failed to publish payment result for orderId=${message.orderId}, payment is saved and can be queried via REST`,
          publishError,
        );
      }

      this.logger.log('✅ Payment order processed successfully');
      this.updateMetrics(true, startTime);
    } catch (error) {
      this.updateMetrics(false, startTime);
      this.logger.error(
        `Failed to process payment for order ${message.orderId}: `,
        error.stack,
      );

      // IMPORTANTE: Relançamos o erro para o RabbitMQ fazer o Nack
      throw error;
    }
  }

  private validateMessage(message: PaymentOrderMessage): boolean {
    if (!message.orderId) {
      this.logger.error('Missing orderId in payment message');
      return false;
    }

    if (!message.userId) {
      this.logger.error('Missing userId in payment message');
      return false;
    }

    if (!message.amount || message.amount <= 0) {
      this.logger.error(`Invalid amount in payment message`);
      return false;
    }

    if (!message.paymentMethod) {
      this.logger.error('Missing paymentMethod in payment message');
      return false;
    }

    if (!message.items || message.items.length === 0) {
      this.logger.error('No items in payment message');
      return false;
    }

    return true;
  }

  private updateMetrics(success: boolean, strartTime: number): void {
    // Calcula o tempo de processamento desta mensagem
    const processingTime = Date.now() - strartTime;

    // Incrementa contadores
    this.metrics.totalProcessed++;
    this.metrics.lastProcessedAt = new Date();

    if (success) {
      this.metrics.totalSuccess++;
    } else {
      this.metrics.totalFailed++;
    }

    // Atualiza tempo médio de processamento
    this.totalProcessingTime += processingTime;
    this.metrics.averageProcessingTime = Math.round(
      this.totalProcessingTime / this.metrics.totalProcessed,
    );

    // Log de métricas a cada 10 mensagens ( ou 100 em produção)
    if (this.metrics.totalProcessed % 10 === 0) {
      this.logMetricsSummary();
    }
  }

  incrementRetryCount(): void {
    this.metrics.totalRetries++;
  }

  private logMetricsSummary(): void {
    const successRate =
      this.metrics.totalProcessed > 0
        ? (
            (this.metrics.totalSuccess / this.metrics.totalProcessed) *
            100
          ).toFixed(2)
        : '0';

    this.logger.log('==== CONSUMER METRICS ====');
    this.logger.log(`Total Processed: ${this.metrics.totalProcessed}`);
    this.logger.log(`Success: ${this.metrics.totalSuccess}`);
    this.logger.log(`Failed: ${this.metrics.totalFailed}`);
    this.logger.log(`Retries: ${this.metrics.totalRetries}`);
    this.logger.log(`Success Rate: ${successRate}%`);
    this.logger.log(
      `Average Processing Time: ${this.metrics.averageProcessingTime}ms`,
    );
    this.logger.log('=========================');
  }

  getMetrics(): ConsumerMetrics {
    // Retorna cópia para evitar modificações externa
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      totalProcessed: 0,
      totalSuccess: 0,
      totalFailed: 0,
      totalRetries: 0,
      lastProcessedAt: null,
      startedAt: new Date(),
      averageProcessingTime: 0,
    };
    this.totalProcessingTime = 0;
    this.logger.log('Consumer metrics reset');
  }
}
