import { Injectable } from '@nestjs/common';
import { Invoice } from './invoices.entity';

@Injectable()
export class InvoicesService {

  getInvoices(): Invoice[] {
    return [
      {
        id: 1,
        vessel_id: 101,
        amount: 5000,
        issued_at: new Date(),
        status: 'PAID',
      },
    ];
  }
}