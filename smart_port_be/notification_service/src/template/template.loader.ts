import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';

export interface CompiledTemplate {
  subject: string;
  bodyEn: string;
}

export class TemplateLoader {
  private static readonly logger = new Logger(TemplateLoader.name);
  private static readonly BASE = path.join(__dirname);
  
  private static readonly SUBJECTS: Record<string, string> = {
    'allocation.confirmed': 'Berth Reserved — Payment Required by {{lockExpiry}}',
    'payment.confirmed': 'Payment Confirmed — Berth {{berthId}} Booked',
    'payment.failed': 'Payment Failed — Berth Reservation Released',
    'vessel.overstayed': 'URGENT: Overstay Penalty Applied — {{vesselName}}',
    'penalty.trigger': 'Penalty Invoice Updated — {{vesselName}}',
  };

  /**
   * Interpolate template variables
   * Replaces {{varName}} with the corresponding value from variables object
   */
  private static interpolate(
    template: string,
    variables: Record<string, string>,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (!(key in variables)) {
        TemplateLoader.logger.warn(
          `Variable "${key}" not provided for interpolation`,
        );
        return `{{${key}}}`;
      }
      return variables[key];
    });
  }

  /**
   * Load and compile an email template
   * @param eventName - The name of the event (should match a template directory)
   * @param variables - Variables to interpolate into the template
   * @returns Compiled template with subject and body
   * @throws Error if template directory or file not found
   */
  static load(
    eventName: string,
    variables: Record<string, string>,
  ): CompiledTemplate {
    try {
      const templateDir = path.join(TemplateLoader.BASE, eventName);
      
      // Validate template directory exists
      if (!fs.existsSync(templateDir)) {
        throw new Error(`Template directory not found: ${templateDir}`);
      }

      const bodyPath = path.join(templateDir, 'body.e.html');
      
      // Validate template file exists
      if (!fs.existsSync(bodyPath)) {
        throw new Error(`Template file not found: ${bodyPath}`);
      }

      const bodyEn = fs.readFileSync(bodyPath, 'utf-8');
      const subject = TemplateLoader.SUBJECTS[eventName] ?? eventName;

      return {
        subject: TemplateLoader.interpolate(subject, variables),
        bodyEn: TemplateLoader.interpolate(bodyEn, variables),
      };
    } catch (err) {
      TemplateLoader.logger.error(
        `Failed to load template "${eventName}": ${err instanceof Error ? err.message : 'Unknown error'}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }
}