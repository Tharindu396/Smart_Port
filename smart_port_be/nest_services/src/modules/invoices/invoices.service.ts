import { Injectable } from '@nestjs/common';
import { Invoice } from '../../core/enitites/invoices.entity';

//to do: implement with database
@Injectable()
export class InvoicesService {
  private readonly invoices: Invoice[] = [
    {
      id: 1,
      vessel_id: 101,
      amount: 5000,
      issued_at: new Date(),
      status: 'PAID',
    },
  ];

  getInvoices(): Invoice[] {
    return this.invoices;
  }

  createInvoice(invoiceData: Omit<Invoice, 'id'>): Invoice {
    const invoice: Invoice = {
      ...invoiceData,
      id: this.invoices.length + 1,
    };
    this.invoices.push(invoice);
    return invoice;
  }

  deleteInvoice(id: number): { deleted: boolean } {
    const index = this.invoices.findIndex((invoice) => invoice.id === id);
    if (index !== -1) {
      this.invoices.splice(index, 1);
      return { deleted: true };
    }
    return { deleted: false };
  }
}