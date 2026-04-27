export interface AllocationConfirmedEvent {
  visitId: string;
  vesselName: string;
  berthId: string;
  berthName: string;
  shippingCompanyEmail: string;
  lockExpiry: string;
}

export interface PaymentConfirmedEvent {
  visitId: string;
  vesselName: string;
  berthId: string;
  shippingCompanyEmail: string;
  amount: number;
  currency: string;
  transactionId: string;
  confirmedAt: string;
}

export interface PaymentFailedEvent {
  visitId: string;
  vesselName: string;
  shippingCompanyEmail: string;
  reason: string;
}

export interface VesselOverstayedEvent {
  visitId: string;
  vesselName: string;
  berthId: string;
  shippingCompanyEmail: string;
  scheduledDeparture: string;
  overdueByMinutes: number;
  surchargePerHour: number;
}

export interface PenaltyTriggerEvent {
  visitId: string;
  vesselName: string;
  shippingCompanyEmail: string;
  penaltyAmount: number;
  currency: string;
  reason: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  bodyEn: string;
}
