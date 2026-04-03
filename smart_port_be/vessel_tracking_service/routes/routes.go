package routes

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(app *gin.Engine) {
	api := app.Group("/api")

	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "OK"})
	})

	VesselRoutes(api)
}
