package routes

import (
	"go-server/handlers"

	"github.com/gin-gonic/gin"
)

func VesselRoutes(api *gin.RouterGroup) {
	router := api.Group("/vessels")
	router.GET("/", handlers.FetchAllAisData)
	//router.GET("/:mmsi", handlers.FetchVesselByMMSI)
}
