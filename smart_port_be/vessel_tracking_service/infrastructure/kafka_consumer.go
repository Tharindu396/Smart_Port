package infrastructure

import (
	"context"
	"encoding/json"
	"log"
	"strings"

	"github.com/segmentio/kafka-go"
)

type InvoicePaidEvent struct {
	InvoiceID string `json:"invoice_id"`
	VesselID  string `json:"vessel_id"`
	PaidAt    string `json:"paid_at"`
}

type VesselStatusUpdater func(mmsi string, status string) error

type KafkaConsumer struct {
	Reader        *kafka.Reader
	statusUpdater VesselStatusUpdater
}

func NewKafkaConsumer(brokers []string, groupID string, statusUpdater VesselStatusUpdater) *KafkaConsumer {
	return &KafkaConsumer{
		Reader: kafka.NewReader(kafka.ReaderConfig{
			Brokers:     brokers,
			GroupID:     groupID,
			Topic:       "invoice.paid",
			StartOffset: kafka.LastOffset,
			MinBytes:    10e3,
			MaxBytes:    10e6,
		}),
		statusUpdater: statusUpdater,
	}
}

func (c *KafkaConsumer) Start(ctx context.Context) {
	log.Println("🚀 Vessel Tracking Kafka consumer started")

	for {
		msg, err := c.Reader.ReadMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			log.Printf("❌ Kafka consumer stopped: %v", err)
			return
		}

		if strings.TrimSpace(string(msg.Value)) == "" {
			continue
		}

		var event InvoicePaidEvent
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			log.Printf("⚠️ Failed to parse invoice.paid event: %v", err)
			continue
		}

		if event.VesselID == "" {
			log.Printf("⚠️ invoice.paid event missing vessel_id")
			continue
		}

		if err := c.statusUpdater(event.VesselID, "docked"); err != nil {
			log.Printf("❌ Failed to update vessel %s status to docked: %v", event.VesselID, err)
			continue
		}

		log.Printf("✅ Vessel %s marked as docked after invoice payment", event.VesselID)
	}
}

func (c *KafkaConsumer) Close() error {
	if c.Reader == nil {
		return nil
	}
	return c.Reader.Close()
}
