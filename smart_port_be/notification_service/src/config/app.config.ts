import { Injectable } from '@nestjs/common';

export interface AppConfig {
  port: number;
}

@Injectable()
export class AppConfigService {
  private readonly config: AppConfig;

  constructor() {
    this.config = {
      port: this.parsePort(process.env.PORT || '3010'),
    };
  }

  private parsePort(port: string | number): number {
    const parsed = parseInt(String(port), 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 65535) {
      throw new Error(`Invalid port: ${port}`);
    }
    return parsed;
  }

  getConfig(): AppConfig {
    return this.config;
  }

  getPort(): number {
    return this.config.port;
  }
}
