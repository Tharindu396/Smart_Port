package handlers

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"os"
	"strconv"
	"time"
)

var (
	vesselPrefixes = []string{"MV", "SS", "MT", "Ocean", "Sea", "Port", "Harbor", "Atlantic", "Pacific"}
	vesselNames    = []string{"Aurora", "Voyager", "Neptune", "Horizon", "Meridian", "Atlas", "Navigator", "Starlight", "Wave Runner", "Endeavour"}
	vesselTypes    = []string{"at_berth", "approaching", "underway", "idle"}
)

func envIntOrDefault(key string, fallback int) int {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}

	value, err := strconv.Atoi(raw)
	if err != nil || value <= 0 {
		log.Printf("invalid value for %s=%q, using default %d", key, raw, fallback)
		return fallback
	}

	return value
}

func randomVessel(rng *rand.Rand, now int64, index int) (string, string, float64, float64, string, float64, float64, float64, float64, int64) {
	mmsi := fmt.Sprintf("%09d", 200000000+rng.Intn(799999999))
	name := fmt.Sprintf("%s %s %d", vesselPrefixes[rng.Intn(len(vesselPrefixes))], vesselNames[rng.Intn(len(vesselNames))], index+1)

	length := 110.0 + rng.Float64()*220.0
	draft := 6.0 + rng.Float64()*10.0
	status := vesselTypes[rng.Intn(len(vesselTypes))]

	// Coordinates around Sri Lanka / Indian Ocean corridor.
	latitude := 4.5 + rng.Float64()*6.5
	longitude := 78.0 + rng.Float64()*6.5

	speed := 0.0
	if status == "underway" || status == "approaching" {
		speed = 4.0 + rng.Float64()*17.0
	}

	heading := rng.Float64() * 360.0
	timestamp := now - int64(rng.Intn(900))

	return mmsi, name, length, draft, status, latitude, longitude, speed, heading, timestamp
}

func regenerateVesselDataset(ctx context.Context, vesselCount int) error {
	if vesselDB == nil {
		return fmt.Errorf("database is not initialized")
	}

	if err := ensureVesselsTable(ctx); err != nil {
		return err
	}

	tx, err := vesselDB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	if _, err = tx.ExecContext(ctx, `DELETE FROM vessels`); err != nil {
		return err
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	now := time.Now().Unix()

	insertQuery := `
		INSERT INTO vessels (mmsi, name, length, draft, status, latitude, longitude, speed, heading, timestamp)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`

	for i := 0; i < vesselCount; i++ {
		mmsi, name, length, draft, status, latitude, longitude, speed, heading, timestamp := randomVessel(rng, now, i)

		if _, err = tx.ExecContext(
			ctx,
			insertQuery,
			mmsi,
			name,
			length,
			draft,
			status,
			latitude,
			longitude,
			speed,
			heading,
			timestamp,
		); err != nil {
			return err
		}
	}

	if err = tx.Commit(); err != nil {
		return err
	}

	return nil
}

// StartVesselAutoRefreshScheduler seeds mock vessel data immediately
// and refreshes it on the configured interval.
func StartVesselAutoRefreshScheduler() {
	refreshHours := envIntOrDefault("AUTO_VESSEL_REFRESH_HOURS", 6)
	vesselCount := envIntOrDefault("AUTO_VESSEL_COUNT", 40)
	refreshInterval := time.Duration(refreshHours) * time.Hour

	refresh := func() {
		ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
		defer cancel()

		if err := regenerateVesselDataset(ctx, vesselCount); err != nil {
			log.Printf("[vessel-seed] failed to regenerate vessels: %v", err)
			return
		}

		log.Printf("[vessel-seed] generated %d vessels", vesselCount)
	}

	// Initial seed on service startup.
	refresh()

	go func() {
		ticker := time.NewTicker(refreshInterval)
		defer ticker.Stop()

		for range ticker.C {
			refresh()
		}
	}()

	log.Printf("[vessel-seed] scheduler enabled: every %s (count=%d)", refreshInterval, vesselCount)
}
