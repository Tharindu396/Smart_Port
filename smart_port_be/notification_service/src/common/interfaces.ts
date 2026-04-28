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
  VesselName: string;
  VesselID: string;
  ShippingAgentEmail: string;
  scheduledDeparture: string;
  overdueByMinutes: number;
  surchargePerHour: number;
}

export interface PenaltyTriggerEvent {
  visitId: string;
  vessel_name: string;
  ShippingAgentEmail: string;
  penalty_amount: number;
  currency: string;
  reason: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  bodyEn: string;
}
