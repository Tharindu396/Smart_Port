export const appConfig = () => ({
  port: parseInt(process.env.PORT, 10) || 5004,

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'invoice_db',
  },

  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    groupId: process.env.KAFKA_GROUP_ID || 'invoice-service-group',
    clientId: process.env.KAFKA_CLIENT_ID || 'invoice-service',
  },

  tariff: {
    berthPerHour: parseFloat(process.env.TARIFF_BERTH_PER_HOUR) || 150.0,
    yardPerContainerPerHour:
      parseFloat(process.env.TARIFF_YARD_PER_CONTAINER_PER_HOUR) || 12.0,
    penaltyPerHour: parseFloat(process.env.TARIFF_PENALTY_PER_HOUR) || 300.0,
    portFee: parseFloat(process.env.TARIFF_PORT_FEE) || 500.0,
  },

  // Berthing Service base URL — used by BerthingClient to fetch allocation details
  // after receiving thin Kafka events (which only carry vesselID + signal string)
  berthingServiceUrl: process.env.BERTHING_SERVICE_URL || 'http://localhost:5003',
});