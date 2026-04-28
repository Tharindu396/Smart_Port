package infrastructure

import (
	"context"
	"encoding/json"
	"log"

	"github.com/segmentio/kafka-go"
)

type KafkaProducer struct {
	DepartedWriter   *kafka.Writer
	OverstayedWriter *kafka.Writer
}

// VesselDepartedEvent represents a vessel departing from berth
type VesselDepartedEvent struct {
	VesselID           string  `json:"vessel_id"`
	Timestamp          int64   `json:"timestamp"`
	Latitude           float64 `json:"latitude"`
	Longitude          float64 `json:"longitude"`
	VesselName         string  `json:"vessel_name"`
	ShippingAgentEmail string  `json:"shipping_agent_email"`
}

// VesselOverstayedEvent represents a vessel overstaying its berth slot
type VesselOverstayedEvent struct {
	VesselID           string  `json:"vessel_id"`
	Timestamp          int64   `json:"timestamp"`
	CheckoutTime       int64   `json:"checkout_time"`
	OverstayHours      float64 `json:"overstay_hours"`
	VesselName         string  `json:"vessel_name"`
	ShippingAgentEmail string  `json:"shipping_agent_email"`
}

func NewKafkaProducer(brokers []string) *KafkaProducer {
	return &KafkaProducer{
		DepartedWriter: &kafka.Writer{
			Addr:     kafka.TCP(brokers...),
			Topic:    "vessel.departed",
			Balancer: &kafka.LeastBytes{},
		},
		OverstayedWriter: &kafka.Writer{
			Addr:     kafka.TCP(brokers...),
			Topic:    "vessel.overstayed",
			Balancer: &kafka.LeastBytes{},
		},
	}
}

// EmitVesselDeparted publishes a vessel.departed event
func (p *KafkaProducer) EmitVesselDeparted(ctx context.Context, vesselID string, event VesselDepartedEvent) error {
	eventBytes, err := json.Marshal(event)
	if err != nil {
		log.Printf("Failed to marshal VesselDepartedEvent: %v", err)
		return err
	}

	message := kafka.Message{
		Key:   []byte(vesselID),
		Value: eventBytes,
	}

	if err := p.DepartedWriter.WriteMessages(ctx, message); err != nil {
		log.Printf("Failed to emit vessel.departed for %s: %v", vesselID, err)
		return err
	}

	log.Printf("Emitted vessel.departed for vessel %s", vesselID)
	return nil
}

// EmitVesselOverstayed publishes a vessel.overstayed event
func (p *KafkaProducer) EmitVesselOverstayed(ctx context.Context, vesselID string, event VesselOverstayedEvent) error {
	eventBytes, err := json.Marshal(event)
	if err != nil {
		log.Printf("Failed to marshal VesselOverstayedEvent: %v", err)
		return err
	}

	message := kafka.Message{
		Key:   []byte(vesselID),
		Value: eventBytes,
	}

	if err := p.OverstayedWriter.WriteMessages(ctx, message); err != nil {
		log.Printf("Failed to emit vessel.overstayed for %s: %v", vesselID, err)
		return err
	}

	log.Printf("Emitted vessel.overstayed for vessel %s with %.2f hours overstay", vesselID, event.OverstayHours)
	return nil
}

// Close closes both Kafka writers
func (p *KafkaProducer) Close() error {
	if err := p.DepartedWriter.Close(); err != nil {
		log.Printf("Failed to close DepartedWriter: %v", err)
		return err
	}
	if err := p.OverstayedWriter.Close(); err != nil {
		log.Printf("Failed to close OverstayedWriter: %v", err)
		return err
	}
	return nil
}
