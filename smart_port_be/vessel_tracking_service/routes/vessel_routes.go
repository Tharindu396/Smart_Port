package routes

import (
	"go-server/handlers"

	"github.com/gin-gonic/gin"
)

func VesselRoutes(api *gin.RouterGroup) {
	router := api.Group("/vessels")
	router.POST("", handlers.CreateVessel)
	router.POST("/refresh", handlers.RefreshVesselDataset)
	router.GET("", handlers.GetAllVessels)
	router.GET("/:mmsi", handlers.GetVesselByMMSI)
	router.PUT("/:mmsi", handlers.UpdateVessel)
	router.DELETE("/:mmsi", handlers.DeleteVessel)

	api.GET("/vessels/ais", handlers.FetchAllAisData)
}
