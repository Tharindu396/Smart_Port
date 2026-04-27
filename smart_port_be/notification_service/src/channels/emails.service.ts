import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailConfigService } from '../config/email.config';
import { EmailOptions } from '../common/interfaces';
import { EMAIL_DEFAULTS } from '../common/constants';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly emailFrom: string;

  constructor(private readonly emailConfig: EmailConfigService) {
    const config = this.emailConfig.getConfig();
    this.emailFrom = config.emailFrom;
    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.secure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });
  }

  async send(options: EmailOptions): Promise<void> {
    try {
      this.validateEmailOptions(options);

      await this.transporter.sendMail({
        from: `"${EMAIL_DEFAULTS.SENDER_NAME}" <${this.emailFrom}>`,
        to: options.to,
        subject: options.subject,
        html: options.bodyEn,
      });

      this.logger.log(`Email sent → ${options.to} | "${options.subject}"`);
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${err instanceof Error ? err.message : 'Unknown error'}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }

  private validateEmailOptions(options: EmailOptions): void {
    if (!options.to || !options.subject || !options.bodyEn) {
      throw new Error('Email options missing required fields: to, subject, bodyEn');
    }
  }
}