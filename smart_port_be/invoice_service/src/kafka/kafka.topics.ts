/**
 * Kafka Topics consumed BY the Invoice Service.
 *
 * berth-reservations:
 *   Producer: berthing_service/internal/infrastructure/kafka_producer.go → EmitBerthReserved()
 *   Key:   vesselID  (visit ID string)
 *   Value: BerthReservedEvent JSON {vessel_id, vessel_name, allocated_by, allocated_at, slot_ids, lock_expiry}
 *
 * payment.updates:
 *   Producer: berthing_service/internal/infrastructure/kafka_consumer.go
 *   Key:   vesselID  (string)
 *   Value: "SUCCESS" | "FAILURE" (plain string — not JSON)
 */
export const KAFKA_TOPICS_INBOUND = {
  // Emitted by Go KafkaProducer.EmitBerthReserved() — topic name is "berth-reservations"
  BERTH_RESERVATIONS: 'berth-reservations',

  // Emitted when payment confirmed (SUCCESS) or fails (FAILURE)
  PAYMENT_UPDATES: 'payment.updates',

  // Emitted by Vessel Tracking Service when vessel leaves berth geofence
  VESSEL_DEPARTED: 'vessel.departed',

  // Emitted by Vessel Tracking Service when vessel stays past checkout
  VESSEL_OVERSTAYED: 'vessel.overstayed',
} as const;

/**
 * Kafka Topics produced BY the Invoice Service.
 * Consumed by Logistics Service, Notification Service, etc.
 */
export const KAFKA_TOPICS_OUTBOUND = {
  INVOICE_CREATED: 'invoice.created',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_CANCELLED: 'invoice.cancelled',
  PENALTY_APPLIED: 'invoice.penalty_applied',
} as const;