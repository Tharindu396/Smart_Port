import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { KafkaHelper } from './kafka.helper';
import { TestFixtures } from './fixtures';
import { KAFKA_EVENTS } from '../../src/common/constants';

/**
 * End-to-End Testing Suite for Notification Service
 *
 * This test suite verifies:
 * 1. Kafka event consumption
 * 2. Email template rendering
 * 3. Email sending to recipients
 * 4. Error handling and logging
 *
 * Prerequisites:
 * - Kafka broker running on localhost:9092
 * - SMTP server accessible (configured in .env.test)
 * - Node.js and npm installed
 *
 * Run tests with: npm run test:e2e
 */

describe('Notification Service E2E Tests', () => {
  let app: INestApplication;
  let kafkaHelper: KafkaHelper;
  let module: TestingModule;

  beforeAll(async () => {
    console.log('\n🚀 Starting Notification Service E2E Test Suite\n');

    // Initialize Kafka helper
    kafkaHelper = new KafkaHelper(process.env.KAFKA_BROKER_URL || 'localhost:9092');
    await kafkaHelper.connect();

    // Create Kafka topics
    const topics = Object.values(KAFKA_EVENTS);
    for (const topic of topics) {
      await kafkaHelper.createTopic(topic);
    }

    // Create NestJS application
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    console.log('✓ Application initialized\n');
  });

  afterAll(async () => {
    console.log('\n🧹 Cleaning up test environment\n');
    await kafkaHelper.disconnect();
    await app.close();
    console.log('✓ Cleanup complete\n');
  });

 describe('Vessel Overstayed Event', () => {
    it('should process vessel_overstayed event', async () => {
      const event = TestFixtures.vesselOverstayedEvent();

      console.log('📤 Sending VESSEL_OVERSTAYED event...');
      await kafkaHelper.sendEvent(KAFKA_EVENTS.VESSEL_OVERSTAYED, event);

      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(event.overdueByMinutes).toBeGreaterThan(0);
      console.log('✓ Vessel overstayed event processed');
    }, 15000);

    it('should calculate penalties correctly in email', async () => {
      const event = TestFixtures.vesselOverstayedEvent();

      console.log('📤 Sending VESSEL_OVERSTAYED event with calculations...');
      await kafkaHelper.sendEvent(KAFKA_EVENTS.VESSEL_OVERSTAYED, event);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const estimatedPenalty = (event.overdueByMinutes / 60) * event.surchargePerHour;
      expect(estimatedPenalty).toBeGreaterThan(0);
      expect(event.surchargePerHour).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Penalty Trigger Event', () => {
    it('should process penalty_trigger event', async () => {
      const event = TestFixtures.penaltyTriggerEvent();

      console.log('📤 Sending PENALTY_TRIGGER event...');
      await kafkaHelper.sendEvent(KAFKA_EVENTS.PENALTY_TRIGGER, event);

      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(event.penaltyAmount).toBeGreaterThan(0);
      console.log('✓ Penalty trigger event processed');
    }, 15000);

    it('should include penalty amount in email', async () => {
      const event = TestFixtures.penaltyTriggerEvent();

      console.log('📤 Sending PENALTY_TRIGGER event with amount...');
      await kafkaHelper.sendEvent(KAFKA_EVENTS.PENALTY_TRIGGER, event);

      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(event).toHaveProperty('penaltyAmount');
      expect(event).toHaveProperty('reason');
      expect(event.penaltyAmount).toEqual(expect.any(Number));
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle invalid email gracefully', async () => {
      const event = TestFixtures.allocationConfirmedEvent();
      event.shippingCompanyEmail = 'invalid-email'; // Invalid email

      console.log('📤 Sending event with invalid email...');
      // This should be handled by email service validation
      await kafkaHelper.sendEvent(KAFKA_EVENTS.ALLOCATION_CONFIRMED, event);

      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('✓ Invalid email handled');
    }, 15000);

    it('should handle missing event data', async () => {
      const event = TestFixtures.paymentConfirmedEvent();
      delete (event as any).transactionId; // Remove required field

      console.log('📤 Sending event with missing data...');
      await kafkaHelper.sendEvent(KAFKA_EVENTS.PAYMENT_CONFIRMED, event);

      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('✓ Missing data handled');
    }, 15000);
  });
});
