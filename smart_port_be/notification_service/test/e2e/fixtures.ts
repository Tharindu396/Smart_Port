import {
  AllocationConfirmedEvent,
  PaymentConfirmedEvent,
  PaymentFailedEvent,
  VesselOverstayedEvent,
  PenaltyTriggerEvent,
} from '../../src/common/interfaces';

export class TestFixtures {

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
