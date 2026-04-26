import { Injectable } from '@nestjs/common';
import { InvoiceStatus } from './status.enum';

@Injectable()
export class StatusService {

  getInitialStatus(): InvoiceStatus {
    return InvoiceStatus.PENDING;
  }

  markPaid(): InvoiceStatus {
    return InvoiceStatus.PAID;
  }

  cancel(): InvoiceStatus {
    return InvoiceStatus.CANCELLED;
  }
}