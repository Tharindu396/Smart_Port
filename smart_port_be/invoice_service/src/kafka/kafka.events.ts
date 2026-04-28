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

// Inbound from Berthing Service (thin, key-only events)

/** Parsed from the berth-reservations topic message */
export interface BerthReservationRawEvent {
  vesselId: string; // Kafka message key
  signal: 'RESERVED'; // Kafka message value
}

/** Parsed from the payment.updates topic message */
export interface PaymentUpdateRawEvent {
  vesselId: string; // Kafka message key
  status: 'SUCCESS' | 'FAILURE'; // Kafka message value
}

// Berthing Service HTTP API response shapes

/**
 * Shape of one entry from GET /api/v1/allocations/history
 * Matches berthing_service/internal/models/berthing_models.go → AllocationHistoryEntry
 */
export interface AllocationHistoryEntry {
  vessel_id: string;
  vessel_name: string;
  allocated_by: string;
  allocated_at: string; // ISO8601 string from Neo4j toString(datetime())
  slot_ids: string[];
}

/** Full response envelope from GET /api/v1/allocations/history */
export interface AllocationHistoryResponse {
  history: AllocationHistoryEntry[];
}

// Inbound from Vessel Tracking Service (rich JSON events)

/** Topic: vessel.departed */
export interface VesselDepartedEvent {
  vessel_id: string;
  vessel_name: string;
  departed_at: string;
  docked_at: string;
  actual_duration_hours: number;
}

/** Topic: vessel.overstayed */
export interface VesselOverstayedEvent {
  vessel_id: string;
  vessel_name: string;
  overstay_hours: number;
  detected_at: string;
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
  paid_at: string;
}

export interface PenaltyAppliedEvent {
  invoice_id: string;
  vessel_id: string;
  vessel_name: string;
  penalty_amount: number;
  overstay_hours: number;
  new_total: number;
}

export interface InvoiceCancelledEvent {
  invoice_id: string;
  vessel_id: string;
  reason: string;
  cancelled_at: string;
}