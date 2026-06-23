import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as amqp from 'amqplib';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);
  private connection: amqp.ChannelModel;
  private channel: amqp.Channel;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect(); // Quando iniciar o modulo, ele vai experar a conexão com o Rabbitmq
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const rabbitmqUrl = this.configService.get<string>(
        'RABBITMQ_URL',
        'amqp://admin:admin@localhost:5672',
      );

      this.connection = await amqp.connect(rabbitmqUrl); // Conexão é literalmente a conexão entre o projeto e o rabbitmq
      // Canal é por onde sai as mensagens, tudo passa por aqui. Permite varias operações simultaneas entre projetos diferentes
      this.channel = await this.connection.createChannel();
      this.logger.log('Connected to RabbitMQ successfully');

      // Event listeners para monitorar a conexão
      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
      });

      this.connection.on('blocked', (reason) => {
        this.logger.warn('RabbitMQ connection blocked: ', reason);
      });

      this.connection.on('unblocked', () => {
        this.logger.log('RabbitMQ connection unblocked');
      });
    } catch (error) {
      this.logger.warn(
        'Failed to connect to RabbitMQ, continuing without message queue: ',
        error.message || error,
      );
    }
  }

  private async disconnect() {
    try {
      // Fecha canal primeiro
      if (this.channel) {
        await this.channel.close();
        this.logger.log('RabbitMQ channel closed');
      }

      // Depois fecha a conexão
      if (this.connection) {
        await this.connection.close();
        this.logger.log('Disconnected from RabbitMQ');
      }
    } catch (error) {
      this.logger.error('Failed to disconnect from RabbitMQ: ', error);
    }
  }

  getChannel(): amqp.Channel {
    return this.channel;
  }

  getConnection(): amqp.ChannelModel {
    return this.connection;
  }

  async publishMessage(
    exchange: string,
    routingKey: string,
    message: any,
  ): Promise<void> {
    try {
      if (!this.channel) {
        this.logger.warn(
          'RabbitMQ channel not available, skipping message publish',
        );
        return;
      }

      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      const messageBuffer = Buffer.from(JSON.stringify(message));

      const published = this.channel.publish(
        exchange,
        routingKey,
        messageBuffer,
        {
          persistent: true,
          timestamp: Date.now(),
          contentType: 'application/json',
        },
      );

      if (!published) {
        throw new Error('Failed to publish message to RabbitMQ');
      }

      this.logger.log(`Message published to ${exchange}:${routingKey}`);
      this.logger.debug(`Message content: ${JSON.stringify(message)}`);
    } catch (error) {
      this.logger.error('Error publishing message to RabbitMQ: ', error);
    }
  }

  // Método responsável por criar uma fila e escutar mensagens
  async subscribeToQueue(
    queueName: string, // Nome da fila (opcional se for usar nome randômico)
    exchange: string, // Nome da exchange que vai publicar as mensagens
    routingKey: string, // Chave para filtrar as mensagens
    callback: (message: any) => Promise<void>, // Função que vai processar a mensagem
  ): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel not available');
      }

      await this.channel.assertExchange(exchange, 'topic', {
        durable: true,
      });

      const queue = await this.channel.assertQueue(queueName, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // mensagem vai expirar em 24 horas se não for consumida
          'x-max-length': 10000, // Maximo de 10 mil mensagens na fila
        },
      });

      await this.channel.bindQueue(queue.queue, exchange, routingKey);

      await this.channel.prefetch(1); // Vamos sempre executar e ler uma mensagem por vez

      // Metodo q vai ficar 'ouvindo' a fila, e qnd receber msg, vai chamar o callback e mandar ack
      await this.channel.consume(queue.queue, async (msg) => {
        if (msg) {
          try {
            const message = JSON.parse(msg.content.toString());
            this.logger.log(`Message received from queue: ${queueName}`);
            this.logger.debug(`Message content: ${JSON.stringify(message)}`);
            await callback(message);

            this.channel.ack(msg); // Confirma que a mensagem foi processada e pode ser removida da fila

            this.logger.log(
              `Message processed successfully from queue: ${queueName}`,
            );
          } catch (error) {
            this.logger.error(`Error processing message: `, error);
            this.channel.nack(msg, false, false); // Rejeita a mensagem e não remove da fila
            //TODO: Dead Letter Queue
          }
        }
      });

      this.logger.log(
        `Subscribed to queue: ${queueName} with routing key: ${routingKey}`,
      );
    } catch (error) {
      this.logger.error(`Error subscribing to queue ${queueName}: `, error);
    }
  }
}
