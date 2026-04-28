package main

import (
	"context"
	"log"
	"smartport/berthing-service/config"
	"smartport/berthing-service/internal/allocation"
	"smartport/berthing-service/internal/handlers"
	"smartport/berthing-service/internal/infrastructure"
	"smartport/berthing-service/internal/platform"
	"smartport/berthing-service/internal/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Configuration
	cfg := config.LoadConfig()

	// 2. Infrastructure (Neo4j)
	driver, err := platform.InitNeo4j(cfg)
	if err != nil {
		log.Fatalf("❌ Infrastructure Failure (Neo4j): %v", err)
	}
	defer driver.Close(context.Background())

	// 3. Kafka Infrastructure
	// FIXED: Using cfg.KafkaBrokers instead of hardcoded "localhost:9092"
	producer := infrastructure.NewKafkaProducer(cfg.KafkaBrokers)

	// 4. Dependency Injection
	repo := allocation.NewNeo4jRepository(driver)

	// Pass the producer to the service so it can emit events
	service := allocation.NewService(repo, producer)

	// 5. Background Worker (Kafka Consumer)
	// FIXED: Using cfg.KafkaBrokers here as well
	topics := []string{"vessel.arrivals", "payment.updates"}
	consumer := infrastructure.NewKafkaConsumer(cfg.KafkaBrokers, topics, "berthing-group", service)

	// Start consumer in a separate goroutine so it doesn't block the API
	go consumer.Start(context.Background())

	// 6. Server Setup
	handler := handlers.NewAllocationHandler(service)
	router := gin.Default()
	
	// CORS setup
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept", "Authorization"},
	}))
	
	routes.SetupRoutes(router, handler)

	log.Printf("🚢 Berthing Service initialized on port %s", cfg.ServerPort)
	log.Printf("📡 Kafka Consumer connecting to brokers: %s", cfg.KafkaBrokers)
	log.Printf("📡 Kafka Consumer listening on topics: %v", topics)

	if err := router.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("❌ Server failed: %v", err)
	}
}