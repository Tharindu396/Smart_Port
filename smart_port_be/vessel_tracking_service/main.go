package main

import (
	"go-server/config"
	"go-server/routes"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load env first
	config.LoadEnv()

	r := gin.Default()
	routes.RegisterRoutes(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r.Run(":" + port)
}
