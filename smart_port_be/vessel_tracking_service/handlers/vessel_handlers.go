package handlers

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"go-server/config"
	"go-server/models"

	"github.com/gin-gonic/gin"
)

var vesselDB *sql.DB

func SetVesselDB(db *sql.DB) {
	vesselDB = db
}

func ensureVesselsTable(ctx context.Context) error {
	query := `
		CREATE TABLE IF NOT EXISTS vessels (
			mmsi TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			length DOUBLE PRECISION,
			draft DOUBLE PRECISION,
			status TEXT,
			latitude DOUBLE PRECISION,
			longitude DOUBLE PRECISION,
			speed DOUBLE PRECISION,
			heading DOUBLE PRECISION,
			timestamp BIGINT
		)
	`

	_, err := vesselDB.ExecContext(ctx, query)
	return err
}

func CreateVessel(c *gin.Context) {
	if vesselDB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database is not initialized"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	if err := ensureVesselsTable(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var vessel models.Vessel
	if err := c.ShouldBindJSON(&vessel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if vessel.MMSI == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "mmsi is required"})
		return
	}

	query := `
		INSERT INTO vessels (mmsi, name, length, draft, status, latitude, longitude, speed, heading, timestamp)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`

	_, err := vesselDB.ExecContext(
		ctx,
		query,
		vessel.MMSI,
		vessel.Name,
		vessel.Length,
		vessel.Draft,
		vessel.Status,
		vessel.Latitude,
		vessel.Longitude,
		vessel.Speed,
		vessel.Heading,
		vessel.Timestamp,
	)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, vessel)
}

func GetAllVessels(c *gin.Context) {
	if vesselDB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database is not initialized"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	if err := ensureVesselsTable(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rows, err := vesselDB.QueryContext(ctx, `
		SELECT mmsi, name, length, draft, status, latitude, longitude, speed, heading, timestamp
		FROM vessels
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	vessels := make([]models.Vessel, 0)
	for rows.Next() {
		var vessel models.Vessel
		if err := rows.Scan(
			&vessel.MMSI,
			&vessel.Name,
			&vessel.Length,
			&vessel.Draft,
			&vessel.Status,
			&vessel.Latitude,
			&vessel.Longitude,
			&vessel.Speed,
			&vessel.Heading,
			&vessel.Timestamp,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		vessels = append(vessels, vessel)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, vessels)
}

func GetVesselByMMSI(c *gin.Context) {
	if vesselDB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database is not initialized"})
		return
	}

	mmsi := c.Param("mmsi")
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	if err := ensureVesselsTable(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var vessel models.Vessel
	err := vesselDB.QueryRowContext(
		ctx,
		`SELECT mmsi, name, length, draft, status, latitude, longitude, speed, heading, timestamp FROM vessels WHERE mmsi = $1`,
		mmsi,
	).Scan(
		&vessel.MMSI,
		&vessel.Name,
		&vessel.Length,
		&vessel.Draft,
		&vessel.Status,
		&vessel.Latitude,
		&vessel.Longitude,
		&vessel.Speed,
		&vessel.Heading,
		&vessel.Timestamp,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "vessel not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, vessel)
}

func UpdateVessel(c *gin.Context) {
	if vesselDB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database is not initialized"})
		return
	}

	mmsi := c.Param("mmsi")
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	if err := ensureVesselsTable(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var vessel models.Vessel
	if err := c.ShouldBindJSON(&vessel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := `
		UPDATE vessels
		SET name = $2, length = $3, draft = $4, status = $5, latitude = $6, longitude = $7, speed = $8, heading = $9, timestamp = $10
		WHERE mmsi = $1
	`

	result, err := vesselDB.ExecContext(
		ctx,
		query,
		mmsi,
		vessel.Name,
		vessel.Length,
		vessel.Draft,
		vessel.Status,
		vessel.Latitude,
		vessel.Longitude,
		vessel.Speed,
		vessel.Heading,
		vessel.Timestamp,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	affected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "vessel not found"})
		return
	}

	vessel.MMSI = mmsi
	c.JSON(http.StatusOK, vessel)
}

func DeleteVessel(c *gin.Context) {
	if vesselDB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database is not initialized"})
		return
	}

	mmsi := c.Param("mmsi")
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	if err := ensureVesselsTable(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	result, err := vesselDB.ExecContext(ctx, `DELETE FROM vessels WHERE mmsi = $1`, mmsi)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	affected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "vessel not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "vessel deleted"})
}

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
