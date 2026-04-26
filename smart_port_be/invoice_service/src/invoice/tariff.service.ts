import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvoiceLineItem, LineItemType } from './entities/invoice-line-item.entity';

export interface TariffCalculation {
  baseBerthFee: number;
  portFee: number;
  totalAmount: number;
  lineItems: Partial<InvoiceLineItem>[];
}

@Injectable()
export class TariffService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Calculates the initial invoice charges when a berth is reserved.
   * Triggered by: berth.reserved event
   *
   * Charge breakdown:
   *  1. Berth Fee = berthPerHour * slotCount * stayDurationHours
   *  2. Port Fee = flat port service fee
   */
  calculateInitialCharges(
    slotCount: number,
    stayDurationHours: number,
  ): TariffCalculation {
    const berthPerHour = this.configService.get<number>('tariff.berthPerHour');
    const portFee = this.configService.get<number>('tariff.portFee');

    const baseBerthFee = berthPerHour * slotCount * stayDurationHours;

    const lineItems: Partial<InvoiceLineItem>[] = [
      {
        type: LineItemType.BERTH_FEE,
        description: `Berth occupancy: ${slotCount} slot(s) × ${stayDurationHours} hour(s) @ $${berthPerHour}/slot/hr`,
        quantity: slotCount * stayDurationHours,
        unit: 'slot-hours',
        unitPrice: berthPerHour,
        amount: baseBerthFee,
      },
      {
        type: LineItemType.PORT_FEE,
        description: 'Standard port service fee',
        quantity: 1,
        unit: 'flat',
        unitPrice: portFee,
        amount: portFee,
      },
    ];

    return {
      baseBerthFee,
      portFee,
      totalAmount: baseBerthFee + portFee,
      lineItems,
    };
  }

  /**
   * Calculates the overstay penalty charge.
   * Triggered by: vessel.overstayed event
   *
   * Charge = penaltyPerHour * overstayHours
   */
  calculateOverstayPenalty(overstayHours: number): {
    penaltyAmount: number;
    lineItem: Partial<InvoiceLineItem>;
  } {
    const penaltyPerHour = this.configService.get<number>('tariff.penaltyPerHour');
    const penaltyAmount = penaltyPerHour * overstayHours;

    return {
      penaltyAmount,
      lineItem: {
        type: LineItemType.OVERSTAY_PENALTY,
        description: `Overstay penalty: ${overstayHours} hour(s) @ $${penaltyPerHour}/hr`,
        quantity: overstayHours,
        unit: 'hours',
        unitPrice: penaltyPerHour,
        amount: penaltyAmount,
      },
    };
  }
}