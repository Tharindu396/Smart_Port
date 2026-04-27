package config

import (
	"log"
	"os"
	"strings"

	"go-server/infrastructure"
)

var kafkaProducer *infrastructure.KafkaProducer

func InitKafkaProducer() *infrastructure.KafkaProducer {
	brokerStr := os.Getenv("KAFKA_BROKERS")
	if brokerStr == "" {
		brokerStr = "127.0.0.1:9092"
		log.Printf("KAFKA_BROKERS not set, using default: %s", brokerStr)
	}

	brokers := strings.Split(brokerStr, ",")
	for i, broker := range brokers {
		brokers[i] = strings.TrimSpace(broker)
	}

	log.Printf("Initializing Kafka producer with brokers: %v", brokers)
	kafkaProducer = infrastructure.NewKafkaProducer(brokers)

	return kafkaProducer
}

func GetKafkaProducer() *infrastructure.KafkaProducer {
	if kafkaProducer == nil {
		return InitKafkaProducer()
	}
	return kafkaProducer
}

func CloseKafkaProducer() error {
	if kafkaProducer != nil {
		return kafkaProducer.Close()
	}
	return nil
}
