import { Kafka } from 'kafkajs';

export class KafkaHelper {
  private kafka: Kafka;
  private producer: any;

  constructor(brokerUrl: string = 'localhost:9092') {
    this.kafka = new Kafka({
      clientId: 'notification-e2e-test',
      brokers: [brokerUrl],
      connectionTimeout: 5000,
      requestTimeout: 10000,
    });
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    console.log('✓ Kafka producer connected');
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    console.log('✓ Kafka producer disconnected');
  }

  async sendEvent(topic: string, event: any): Promise<void> {
    await this.producer.send({
      topic,
      messages: [
        {
          key: event.visitId || event.shipmentId || 'test-key',
          value: JSON.stringify(event),
        },
      ],
    });
    console.log(`✓ Event sent to topic: ${topic}`);
  }

  async createTopic(topic: string): Promise<void> {
    const admin = this.kafka.admin();
    try {
      await admin.connect();
      await admin.createTopics({
        topics: [
          {
            topic,
            numPartitions: 1,
            replicationFactor: 1,
          },
        ],
      });
      console.log(`✓ Topic created: ${topic}`);
    } catch (err: any) {
      // Topic might already exist
      if (!err.message.includes('already exists')) {
        throw err;
      }
    } finally {
      await admin.disconnect();
    }
  }

  getKafka(): Kafka {
    return this.kafka;
  }
}
