package main

import (
	"context"
	"log"
	"smartport/berthing-service/config"
	"smartport/berthing-service/internal/allocation"
	"smartport/berthing-service/internal/handlers"
	"smartport/berthing-service/internal/platform" // Import our new platform package
	"smartport/berthing-service/internal/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Configuration
	cfg := config.LoadConfig()

	// 2. Infrastructure (Platform)
	driver, err := platform.InitNeo4j(cfg)
	if err != nil {
		log.Fatalf("❌ Infrastructure Failure: %v", err)
	}
	defer driver.Close(context.Background())

	// 3. Dependency Injection
	repo := allocation.NewNeo4jRepository(driver)
	service := allocation.NewService(repo)
	handler := handlers.NewAllocationHandler(service)

	// 4. Server Setup
	router := gin.Default()
	routes.SetupRoutes(router, handler)

	log.Printf("🚢 Berthing Service initialized on port %s", cfg.ServerPort)
	router.Run(":" + cfg.ServerPort)
}