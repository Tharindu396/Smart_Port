package infrastructure

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/segmentio/kafka-go"
	
	"smartport/berthing-service/internal/models"
)

type AllocationService interface {
	AllocateBerth(ctx context.Context, vessel models.Vessel) ([]string, error)
	CompleteAllocationByVessel(ctx context.Context, vesselID string) error
	CancelAllocationByVessel(ctx context.Context, vesselID string) error
}


type KafkaConsumer struct {
	Reader  *kafka.Reader
	service AllocationService
}

func NewKafkaConsumer(broker string, topics []string, groupID string, service AllocationService) *KafkaConsumer {
    return &KafkaConsumer{
        Reader: kafka.NewReader(kafka.ReaderConfig{
            Brokers:     []string{broker},
            GroupTopics: topics,
            GroupID:     groupID,
            // 👇 ADD THIS LINE
            StartOffset: kafka.FirstOffset, 
            MinBytes:    10e3, // 10KB
            MaxBytes:    10e6, // 10MB
        }),
        service: service,
    }
}

func (c *KafkaConsumer) Start(ctx context.Context) {
	fmt.Println("🚀 Kafka Consumer started, listening for Port Events...")
	
	for {
		m, err := c.Reader.ReadMessage(ctx)
		if err != nil {
			fmt.Printf("❌ Consumer encountered an error: %v\n", err)
			break
		}

		// Handle events based on the Topic they arrived from
		switch m.Topic {
		
		case "vessel.arrivals":
			// EVENT 1: Logistics says a ship is coming
			var vessel models.Vessel
			if err := json.Unmarshal(m.Value, &vessel); err != nil {
				fmt.Printf("⚠️ Failed to parse vessel arrival data: %v\n", err)
				continue
			}
			fmt.Printf("⚓ Logistics: Vessel %s arrival detected. Initiating allocation...\n", vessel.ID)
			_, err := c.service.AllocateBerth(ctx, vessel)
			if err != nil {
				fmt.Printf("🛑 Allocation failed for %s: %v\n", vessel.ID, err)
			}

		case "payment.updates":
			// EVENT 2: Billing says payment status changed
			vesselID := string(m.Key)
			status := string(m.Value)

			if status == "SUCCESS" {
				fmt.Printf("✅ Billing: Payment SUCCESS for %s. Confirming berth...\n", vesselID)
				err := c.service.CompleteAllocationByVessel(ctx, vesselID)
				if err != nil {
					fmt.Printf("🛑 Error confirming allocation: %v\n", err)
				}
			} else if status == "FAILURE" {
				fmt.Printf("❌ Billing: Payment FAILURE for %s. Releasing reserved slots...\n", vesselID)
				// This is the COMPENSATING TRANSACTION (The "Undo" logic)
				err := c.service.CancelAllocationByVessel(ctx, vesselID)
				if err != nil {
					fmt.Printf("🛑 Error reversing allocation: %v\n", err)
				}
			}
		}
	}
}