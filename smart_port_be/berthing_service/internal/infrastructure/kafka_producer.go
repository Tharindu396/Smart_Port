package infrastructure

import (
	"context"
	"encoding/json"
	"github.com/segmentio/kafka-go"
	"smartport/berthing-service/internal/models"
)

type KafkaProducer struct {
	Writer *kafka.Writer
}

// NewKafkaProducer creates a producer with no default topic; each message sets its own.
func NewKafkaProducer(broker string) *KafkaProducer {
	return &KafkaProducer{
		Writer: &kafka.Writer{
			Addr:     kafka.TCP(broker),
			Balancer: &kafka.LeastBytes{},
		},
	}
}

// EmitBerthReserved publishes to berth-reservations so Invoice Service can create an invoice.
func (p *KafkaProducer) EmitBerthReserved(ctx context.Context, vesselID string, slotIDs []string) error {
	return p.Writer.WriteMessages(ctx, kafka.Message{
		Topic: "berth-reservations",
		Key:   []byte(vesselID),
		Value: []byte("RESERVED"),
	})
}

// EmitAllocationConfirmed publishes to allocation.confirmed so Notification Service
// sends a confirmation email and Logistics Service marks the visit as ALLOCATED.
func (p *KafkaProducer) EmitAllocationConfirmed(ctx context.Context, event models.AllocationConfirmedEvent) error {
	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}
	return p.Writer.WriteMessages(ctx, kafka.Message{
		Topic: "allocation.confirmed",
		Key:   []byte(event.VisitID),
		Value: payload,
	})
}

// EmitAllocationFailed publishes to allocation.failed so Logistics Service
// marks the visit as REJECTED when no suitable berth is available.
func (p *KafkaProducer) EmitAllocationFailed(ctx context.Context, event models.AllocationFailedEvent) error {
	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}
	return p.Writer.WriteMessages(ctx, kafka.Message{
		Topic: "allocation.failed",
		Key:   []byte(event.VisitID),
		Value: payload,
	})
}
