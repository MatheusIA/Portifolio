import { Injectable, Logger } from '@nestjs/common';
import { PaymentOrderMessage } from '../payment-queue.interface';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

export interface DQLMessage {
  content: PaymentOrderMessage;
  properties: {
    messageId?: string;
    timestamp?: number;
    headers?: Record<string, unknown>;
  };
  deathInfo?: {
    reason: string;
    queue: string;
    time: Date;
    count: number;
    exchange: string;
    routingKeys: string[];
  };
}

export interface DQLStats {
  queueName: string;
  messageCount: number;
  consumerCount: number;
}

@Injectable()
export class DlqService {
  private readonly logger = new Logger(DlqService.name);

  private readonly DQL_NAME = 'payment_queue.dlq';
  private readonly EXCHANGE = 'payments';
  private readonly ROUTING_KEY = 'payment.order';

  constructor(private readonly rabbitmqService: RabbitMQService) {}

  // Obtém estatísticas da DLQ
  async getStats(): Promise<DQLStats> {
    const channel = this.rabbitmqService.getChannel();
    if (!channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const queueInfo = await channel.checkQueue(this.DQL_NAME);

    return {
      queueName: this.DQL_NAME,
      messageCount: queueInfo.messageCount,
      consumerCount: queueInfo.consumerCount,
    };
  }

  /**
   * Obtém mensagens da DLQ sem removê-las (peek)
   * Usa o conceito de "get" com nack para visualizar sem consumir
   */
  async peekMessages(limit: number = 10): Promise<DQLMessage[]> {
    const channel = this.rabbitmqService.getChannel();
    if (!channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const messages: DQLMessage[] = [];

    await channel.checkQueue(this.DQL_NAME);

    for (let i = 0; i < limit; i++) {
      const msg = await channel.get(this.DQL_NAME, { noAck: false });

      if (!msg) {
        break;
      }

      try {
        const content = JSON.parse(
          msg.content.toString(),
        ) as PaymentOrderMessage;

        const xDeath = msg.properties.headers?.['x-death'] as
          | Array<{
              reason: string;
              queue: string;
              time: { getTime: () => number };
              count: number;
              exchange: string;
              'routing-keys': string[];
            }>
          | undefined;

        const deathInfo = xDeath?.[0]
          ? {
              reason: xDeath[0].reason,
              queue: xDeath[0].queue,
              time: new Date(xDeath[0].time?.getTime?.() || Date.now()),
              count: xDeath[0].count,
              exchange: xDeath[0].exchange,
              routingKeys: xDeath[0]['routing-keys'],
            }
          : undefined;

        const headers =
          msg.properties.headers && typeof msg.properties.headers === 'object'
            ? (msg.properties.headers as Record<string, unknown>)
            : undefined;

        messages.push({
          content,
          properties: {
            messageId: msg.properties.messageId as string | undefined,
            timestamp: msg.properties.timestamp as number | undefined,
            headers,
          },
          deathInfo,
        });

        channel.nack(msg, false, true);
      } catch (error) {
        channel.nack(msg, false, false);
        this.logger.error('Failed to parse DQL message: ', error);
      }
    }
    return messages;
  }

  /**
   * Reprocessa uma mensagem especifica da DLQ
   * Remove da DLQ e publica na fila principal
   */

  async reprocessMessage(orderId: string): Promise<boolean> {
    const channel = this.rabbitmqService.getChannel();
    if (!channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const stats = await this.getStats();
    let found = false;

    for (let i = 0; i < stats.messageCount; i++) {
      const msg = await channel.get(this.DQL_NAME, { noAck: false });

      if (!msg) {
        break;
      }

      try {
        const content = JSON.parse(
          msg.content.toString(),
        ) as PaymentOrderMessage;

        if (content.orderId === orderId) {
          //Encontrou ! Republica na fila principal
          await this.rabbitmqService.publishMessage(
            this.EXCHANGE,
            this.ROUTING_KEY,
            content,
          );

          // Remove da DLQ (ack)
          channel.ack(msg);
          found = true;

          this.logger.log(`Message ${orderId} reprocessed sucessfully`);
          break;
        } else {
          // Não é a mensagem que procuramos, então devolve para DLQ
          channel.nack(msg, false, true);
        }
      } catch (error) {
        channel.nack(msg, false, true);
        this.logger.error('Failed to process DQL message: ', error);
      }
    }

    return found;
  }

  /**
   * Reprocessa todas as mensagens da DLQ
   */
  async reprocessAll(): Promise<{ processed: number; failed: number }> {
    const channel = this.rabbitmqService.getChannel();

    if (!channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const stats = await this.getStats();
    let processed = 0;
    let failed = 0;

    this.logger.log(`Reprocessing ${stats.messageCount} messages from DLQ`);

    for (let i = 0; i < stats.messageCount; i++) {
      const msg = await channel.get(this.DQL_NAME, { noAck: false });

      if (!msg) break;

      try {
        const content = JSON.parse(
          msg.content.toString(),
        ) as PaymentOrderMessage;

        // Republica na fila principal
        await this.rabbitmqService.publishMessage(
          this.EXCHANGE,
          this.ROUTING_KEY,
          content,
        );

        // Remove da DLQ
        channel.ack(msg);
        processed++;

        this.logger.log(`Reprocessed order ${content.orderId}`);
      } catch (error) {
        // Falhou, mantém na DLQ
        channel.nack(msg, false, true);
        failed++;
        this.logger.error('Failed to reprocess message: ', error);
      }
    }

    this.logger.log(
      `Reprocess complete: ${processed} processed, ${failed} failed`,
    );

    return { processed, failed };
  }

  /**
   * Remove uma mensagem da DLQ (descarta permanentemente)
   */
  async discardMessage(orderId: string): Promise<boolean> {
    const channel = this.rabbitmqService.getChannel();

    if (!channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const stats = await this.getStats();
    let found = false;

    for (let i = 0; i < stats.messageCount; i++) {
      const msg = await channel.get(this.DQL_NAME, { noAck: false });

      if (!msg) {
        break;
      }

      try {
        const content = JSON.parse(
          msg.content.toString(),
        ) as PaymentOrderMessage;

        if (content.orderId === orderId) {
          // Encontrou ! Remove permanentemente ( ack sem reprocessar )
          channel.ack(msg);
          found = true;

          this.logger.log(`Message ${orderId} discarded successfully`);
          break;
        } else {
          // Não é a mensagem, devolve
          channel.nack(msg, false, true);
        }
      } catch (error) {
        channel.nack(msg, false, true); // Devolve com requeue
      }
    }

    return found;
  }

  /**
   * Limpa completamente a DLQ  CUIDADO !!!!(descarta todas as mensagens)
   */
  async purgeAll(): Promise<number> {
    const channel = this.rabbitmqService.getChannel();
    if (!channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const result = await channel.purgeQueue(this.DQL_NAME);
    this.logger.warn(`Purged ${result.messageCount} messages from DLQ`);

    return result.messageCount;
  }
}
