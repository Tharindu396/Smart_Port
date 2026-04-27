import { Injectable } from '@nestjs/common';

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  emailFrom: string;
  secure: boolean;
}

@Injectable()
export class EmailConfigService {
  private readonly config: EmailConfig;

  constructor() {
    this.config = {
      smtpHost: this.validateRequired(process.env.SMTP_HOST, 'SMTP_HOST'),
      smtpPort: this.parsePort(process.env.SMTP_PORT || '587'),
      smtpUser: this.validateRequired(process.env.SMTP_USER, 'SMTP_USER'),
      smtpPass: this.validateRequired(process.env.SMTP_PASS, 'SMTP_PASS'),
      emailFrom: this.validateRequired(process.env.EMAIL_FROM, 'EMAIL_FROM'),
      secure: this.parseBoolean(process.env.SMTP_SECURE || 'false'),
    };
  }

  private validateRequired(value: string | undefined, envVarName: string): string {
    if (!value) {
      throw new Error(`Missing required environment variable: ${envVarName}`);
    }
    return value;
  }

  private parsePort(port: string | number): number {
    const parsed = parseInt(String(port), 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 65535) {
      throw new Error(`Invalid SMTP port: ${port}`);
    }
    return parsed;
  }

  private parseBoolean(value: string): boolean {
    return value.toLowerCase() === 'true';
  }

  getConfig(): EmailConfig {
    return { ...this.config };
  }

  getSmtpHost(): string {
    return this.config.smtpHost;
  }

  getSmtpPort(): number {
    return this.config.smtpPort;
  }

  getSmtpUser(): string {
    return this.config.smtpUser;
  }

  getSmtpPass(): string {
    return this.config.smtpPass;
  }

  getEmailFrom(): string {
    return this.config.emailFrom;
  }

  isSecure(): boolean {
    return this.config.secure;
  }
}
