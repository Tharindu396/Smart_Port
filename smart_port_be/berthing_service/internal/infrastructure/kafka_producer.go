package infrastructure

import (
	"context"
	"github.com/segmentio/kafka-go"
)

type KafkaProducer struct {
	Writer *kafka.Writer
}

func NewKafkaProducer(broker string, topic string) *KafkaProducer {
	return &KafkaProducer{
		Writer: &kafka.Writer{
			Addr:     kafka.TCP(broker),
			Topic:    topic,
			Balancer: &kafka.LeastBytes{},
		},
	}
}

func (p *KafkaProducer) EmitBerthReserved(ctx context.Context, vesselID string, slotIDs []string) error {
	message := kafka.Message{
		Key:   []byte(vesselID),
		Value: []byte("RESERVED"), // In a real app, you'd send JSON here
	}
	return p.Writer.WriteMessages(ctx, message)
}