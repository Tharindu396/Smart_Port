package main

import (
	"go-server/config"
	"go-server/handlers"
	"go-server/routes"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load env first
	config.LoadEnv()
	db := config.InitPostgres()
	defer db.Close()
	handlers.SetVesselDB(db)
	handlers.StartVesselAutoRefreshScheduler()

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
