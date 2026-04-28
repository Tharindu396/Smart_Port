/**
 * What the Berthing Service actually puts on the wire (Go source):
 *
 *   kafka_producer.go → EmitBerthReserved():
 *     Key:   vesselID
 *     Value: "RESERVED"   ← plain string, NOT json
 *
 *   kafka_consumer.go → payment.updates handler:
 *     Key:   vesselID
 *     Value: "SUCCESS" | "FAILURE"  ← plain string
 *
 * So the Invoice Service enriches the data by calling back to
 * the Berthing Service HTTP API after receiving these thin events.
 */

// Inbound from Berthing Service

/**
 * Rich JSON event on the berth-reservations topic.
 * Berthing Service emits this after locking slots so Invoice Service
 * can create a pending invoice without any HTTP callback.
 */
export interface BerthReservedEvent {
  vessel_id: string;    // visit ID (used as vesselId on Invoice)
  vessel_name: string;
  allocated_by: string; // agent ID
  allocated_at: string; // RFC3339
  slot_ids: string[];
  lock_expiry: string;  // RFC3339
}

/** Parsed from the payment.updates topic message */
export interface PaymentUpdateRawEvent {
  vesselId: string; // Kafka message key
  status: 'SUCCESS' | 'FAILURE'; // Kafka message value
}

// Inbound from Vessel Tracking Service (rich JSON events)

/** Topic: vessel.departed — emitted by Vessel Tracking Service */
export interface VesselDepartedEvent {
  vessel_id: string;
  vessel_name: string;
  departed_at: string;            // RFC3339
  docked_at: string;              // RFC3339
  actual_duration_hours: number;
}

/** Topic: vessel.overstayed — emitted by Vessel Tracking Service */
export interface VesselOverstayedEvent {
  vessel_id: string;
  vessel_name: string;
  overstay_hours: number;
  detected_at: string;            // RFC3339
}

// Outbound events produced by Invoice Service 

export interface InvoiceCreatedEvent {
  invoice_id: string;
  vessel_id: string;
  vessel_name: string;
  total_amount: number;
  currency: string;
  due_date: string;
  created_at: string;
}

export interface InvoicePaidEvent {
  invoice_id: string;
  vessel_id: string;
  vessel_name: string;
  paid_at: string;
}

export interface PenaltyAppliedEvent {
  visitId: string;                 // vessel_id (= visitId in our saga)
  vesselName: string;
  shippingCompanyEmail: string;    // empty until email is stored on invoice
  penaltyAmount: number;
  currency: string;
  reason: string;
}

export interface InvoiceCancelledEvent {
  invoice_id: string;
  vessel_id: string;
  vessel_name: string;
  reason: string;
  cancelled_at: string;
}