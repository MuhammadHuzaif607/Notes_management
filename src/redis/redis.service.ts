import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private publisher: Redis;
  private subscriber: Redis;

  constructor() {
    const config = {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
      tls: {}, // optional: remove if not using TLS (like Upstash)
    };

    this.publisher = new Redis(config);
    this.subscriber = new Redis(config);
  }

  getClient() {
    return this.publisher;
  }

  async publish(channel: string, message: any): Promise<number> {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    return this.publisher.publish(channel, payload);
  }

  async subscribe(channel: string, handler: (message: any) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (receivedChannel, rawMessage) => {
      if (receivedChannel === channel) {
        try {
          const parsed = JSON.parse(rawMessage);
          handler(parsed);
        } catch (e) {
          handler(rawMessage); // fallback if not JSON
        }
      }
    });
  }

  onModuleDestroy() {
    this.publisher?.quit();
    this.subscriber?.quit();
  }
}
