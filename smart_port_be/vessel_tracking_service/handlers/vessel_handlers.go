package handlers

import (
	"context"
	"net/http"
	"time"

	"go-server/config"

	"github.com/gin-gonic/gin"
)

func FetchAllAisData(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 20*time.Second)
	defer cancel()

	aisCfg, err := config.LoadAISStreamConfigFromEnv()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := config.NewAISStreamClient(aisCfg)
	defer func() {
		_ = client.Close()
	}()

	if err := client.Connect(ctx); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	vessel, err := client.ReadVessel()
	if err != nil {
		c.JSON(http.StatusGatewayTimeout, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, vessel)
}

// func FetchVesselByMMSI(c *gin.Context) {
// 	mmsi := c.Param("mmsi")

// 	c.JSON(http.StatusOK, gin.H{"message": "Fetch vessel by MMSI", "mmsi": mmsi})

// }
