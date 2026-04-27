import {
  AllocationConfirmedEvent,
  PaymentConfirmedEvent,
  PaymentFailedEvent,
  VesselOverstayedEvent,
  PenaltyTriggerEvent,
} from '../../src/common/interfaces';

export class TestFixtures {
  static allocationConfirmedEvent(): AllocationConfirmedEvent {
    const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    return {
      visitId: 'VISIT-' + Date.now(),
      vesselName: 'MV Test Vessel',
      berthId: 'BERTH-001',
      berthName: 'Berth A',
      shippingCompanyEmail: 'shipping@testcompany.com',
      lockExpiry: futureTime.toISOString(),
    };
  }

  static paymentConfirmedEvent(): PaymentConfirmedEvent {
    return {
      visitId: 'VISIT-' + Date.now(),
      vesselName: 'MV Test Vessel',
      berthId: 'BERTH-001',
      shippingCompanyEmail: 'shipping@testcompany.com',
      amount: 5000.5,
      currency: 'USD',
      transactionId: 'TXN-' + Date.now(),
      confirmedAt: new Date().toISOString(),
    };
  }

  static paymentFailedEvent(): PaymentFailedEvent {
    return {
      visitId: 'VISIT-' + Date.now(),
      vesselName: 'MV Test Vessel',
      shippingCompanyEmail: 'shipping@testcompany.com',
      reason: 'Insufficient funds in account',
    };
  }

  static vesselOverstayedEvent(): VesselOverstayedEvent {
    const scheduledDeparture = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    return {
      visitId: 'VISIT-' + Date.now(),
      vesselName: 'MV Test Vessel',
      berthId: 'BERTH-001',
      shippingCompanyEmail: 'shipping@testcompany.com',
      scheduledDeparture: scheduledDeparture.toISOString(),
      overdueByMinutes: 120,
      surchargePerHour: 500,
    };
  }

  static penaltyTriggerEvent(): PenaltyTriggerEvent {
    return {
      visitId: 'VISIT-' + Date.now(),
      vesselName: 'MV Test Vessel',
      shippingCompanyEmail: 'shipping@testcompany.com',
      penaltyAmount: 1000,
      currency: 'USD',
      reason: 'Exceeded berth time limit',
    };
  }
}
