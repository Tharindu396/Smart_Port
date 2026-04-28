package main

import (
	"context"
	"go-server/config"
	"go-server/handlers"
	"go-server/infrastructure"
	"go-server/routes"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load env first
	config.LoadEnv()
	db := config.InitPostgres()
	defer db.Close()

	// Initialize Kafka producer
	kafkaProducer := config.InitKafkaProducer()
	defer config.CloseKafkaProducer()

	kafkaBrokers := os.Getenv("KAFKA_BROKERS")
	if kafkaBrokers == "" {
		kafkaBrokers = "localhost:9092"
	}
	brokers := strings.Split(kafkaBrokers, ",")
	for i, broker := range brokers {
		brokers[i] = strings.TrimSpace(broker)
	}

	handlers.SetVesselDB(db)
	handlers.SetKafkaProducer(kafkaProducer)
	handlers.StartVesselAutoRefreshScheduler()
	handlers.StartDockedStatusTransitionScheduler()

	kafkaConsumer := infrastructure.NewKafkaConsumer(brokers, "vessel-tracking-service-group", handlers.UpdateVesselStatusByMMSI)
	go kafkaConsumer.Start(context.Background())
	defer kafkaConsumer.Close()

	r := gin.Default()

	frontendUrl := os.Getenv("FRONTEND_URL")
	if frontendUrl == "" {
		frontendUrl = "http://localhost:3000"
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendUrl}, // Next.js frontend
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	routes.RegisterRoutes(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r.Run(":" + port)
}
