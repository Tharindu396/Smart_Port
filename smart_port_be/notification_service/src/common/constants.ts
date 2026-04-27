export const KAFKA_EVENTS = {
  ALLOCATION_CONFIRMED: 'allocation.confirmed',
  PAYMENT_CONFIRMED: 'invoice.paid',
  PAYMENT_FAILED: 'invoice.cancelled',
  VESSEL_OVERSTAYED: 'vessel.overstayed',
  PENALTY_TRIGGER: 'invoice.penalty_applied',
} as const;

export const EMAIL_DEFAULTS = {
  SENDER_NAME: 'Port Management System',
  LOCALE: 'en-US',
  TIMEZONE: 'UTC',
} as const;

export const VALIDATION_RULES = {
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  CURRENCY_PATTERN: /^[A-Z]{3}$/,
} as const;
