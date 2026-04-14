import { Controller, Get } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { Invoice } from './invoices.entity';

@Controller('invoices')
export class InvoicesController {

  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  getInvoices(): Invoice[] {
    return this.invoicesService.getInvoices();
  }
}