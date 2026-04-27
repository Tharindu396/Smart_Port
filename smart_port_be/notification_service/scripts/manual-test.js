#!/usr/bin/env node

/**
 * Manual E2E Testing Script
 * 
 * This script helps you manually test the notification service
 * by sending Kafka events and monitoring responses.
 * 
 * Usage: node scripts/manual-test.js [event-type]
 * 
 * Event types:
 *   allocation  - Allocation confirmed event
 *   payment     - Payment confirmed event
 *   paymentfail - Payment failed event
 *   overstay    - Vessel overstayed event
 *   penalty     - Penalty trigger event
 *   all         - Send all event types (default)
 */

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

const EVENTS = {
  allocation: {
    topic: 'allocation.confirmed',
    payload: {
      visitId: `VISIT-${Date.now()}`,
      vesselName: 'MV Test Vessel',
      berthId: 'BERTH-001',
      berthName: 'Berth A',
      shippingCompanyEmail: 'test@example.com',
      lockExpiry: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    },
  },
  payment: {
    topic: 'payment.confirmed',
    payload: {
      visitId: `VISIT-${Date.now()}`,
      vesselName: 'MV Test Vessel',
      berthId: 'BERTH-001',
      shippingCompanyEmail: 'test@example.com',
      amount: 5000.5,
      currency: 'USD',
      transactionId: `TXN-${Date.now()}`,
      confirmedAt: new Date().toISOString(),
    },
  },
  paymentfail: {
    topic: 'payment.failed',
    payload: {
      visitId: `VISIT-${Date.now()}`,
      vesselName: 'MV Test Vessel',
      shippingCompanyEmail: 'test@example.com',
      reason: 'Insufficient funds in account',
    },
  },
  overstay: {
    topic: 'vessel.overstayed',
    payload: {
      visitId: `VISIT-${Date.now()}`,
      vesselName: 'MV Test Vessel',
      berthId: 'BERTH-001',
      shippingCompanyEmail: 'test@example.com',
      scheduledDeparture: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      overdueByMinutes: 120,
      surchargePerHour: 500,
    },
  },
  penalty: {
    topic: 'penalty.trigger',
    payload: {
      visitId: `VISIT-${Date.now()}`,
      vesselName: 'MV Test Vessel',
      shippingCompanyEmail: 'test@example.com',
      penaltyAmount: 1000,
      currency: 'USD',
      reason: 'Exceeded berth time limit',
    },
  },
};

async function sendEvent(eventType) {
  const event = EVENTS[eventType];
  if (!event) {
    console.error(`❌ Unknown event type: ${eventType}`);
    console.log('Available types:', Object.keys(EVENTS).join(', '));
    return;
  }

  try {
    await producer.connect();
    console.log(`📤 Sending ${eventType} event to topic: ${event.topic}`);
    console.log(`   Payload:`, JSON.stringify(event.payload, null, 2));

    await producer.send({
      topic: event.topic,
      messages: [
        {
          key: event.payload.visitId,
          value: JSON.stringify(event.payload),
        },
      ],
    });

    console.log(`✅ Event sent successfully!`);
    console.log(`⏳ Wait 2-3 seconds for email processing...`);
    console.log(`📧 Check your email inbox for the notification`);
  } catch (error) {
    console.error('❌ Error sending event:', error.message);
  } finally {
    await producer.disconnect();
  }
}

async function sendAllEvents() {
  try {
    await producer.connect();
    console.log('\n🚀 Sending all test events...\n');

    for (const [eventType, event] of Object.entries(EVENTS)) {
      console.log(`📤 Sending ${eventType}...`);
      await producer.send({
        topic: event.topic,
        messages: [
          {
            key: event.payload.visitId,
            value: JSON.stringify(event.payload),
          },
        ],
      });
      console.log(`✅ ${eventType} sent`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n✅ All events sent!');
    console.log('⏳ Wait 3-5 seconds for all emails to be processed...');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await producer.disconnect();
  }
}

const eventType = process.argv[2] || 'all';

if (eventType === 'all') {
  sendAllEvents();
} else {
  sendEvent(eventType);
}
