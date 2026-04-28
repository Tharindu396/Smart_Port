package handlers

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"os"
	"strconv"
	"time"

	"go-server/config"
	"go-server/infrastructure"
	"go-server/models"
)

var (
	vesselPrefixes = []string{"MV", "SS", "MT", "Ocean", "Sea", "Port", "Harbor", "Atlantic", "Pacific"}
	vesselNames    = []string{"Aurora", "Voyager", "Neptune", "Horizon", "Meridian", "Atlas", "Navigator", "Starlight", "Wave Runner", "Endeavour"}
	vesselTypes    = []string{"at_berth", "approaching", "underway", "idle"}
)

type shippingAgent struct {
	ID    string
	Email string
}

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

func randomVessel(rng *rand.Rand, now int64, index int, agents []shippingAgent) (string, string, float64, float64, string, float64, float64, float64, float64, int64, string, string) {
	mmsi := fmt.Sprintf("%09d", 200000000+rng.Intn(799999999))
	name := fmt.Sprintf("%s %s %d", vesselPrefixes[rng.Intn(len(vesselPrefixes))], vesselNames[rng.Intn(len(vesselNames))], index+1)
	agent := agents[rng.Intn(len(agents))]

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

	return mmsi, name, length, draft, status, latitude, longitude, speed, heading, timestamp, agent.ID, agent.Email
}

func loadShippingAgents(ctx context.Context) ([]shippingAgent, error) {
	db, err := config.InitNestUsersPostgres()
	if err != nil {
		return nil, err
	}
	defer db.Close()

	rows, err := db.QueryContext(ctx, `
		SELECT id, email
		FROM users
		WHERE role = 'shipping_agent'
		ORDER BY id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	agents := make([]shippingAgent, 0)
	for rows.Next() {
		var id sql.NullInt64
		var email sql.NullString
		if err := rows.Scan(&id, &email); err != nil {
			return nil, err
		}
		if !id.Valid || !email.Valid {
			continue
		}
		agents = append(agents, shippingAgent{
			ID:    fmt.Sprintf("%d", id.Int64),
			Email: email.String,
		})
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(agents) == 0 {
		return nil, fmt.Errorf("no shipping agents found in nest users database")
	}

	return agents, nil
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

	agents, err := loadShippingAgents(ctx)
	if err != nil {
		return err
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	now := time.Now().Unix()

	insertQuery := `
		INSERT INTO vessels (mmsi, name, length, draft, status, latitude, longitude, speed, heading, timestamp, shipping_agent_id, shipping_agent_email)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	for i := 0; i < vesselCount; i++ {
		mmsi, name, length, draft, status, latitude, longitude, speed, heading, timestamp, shippingAgentID, shippingAgentEmail := randomVessel(rng, now, i, agents)

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
			shippingAgentID,
			shippingAgentEmail,
		); err != nil {
			return err
		}
	}

	if err = tx.Commit(); err != nil {
		return err
	}

	return nil
}

func findDockedVesselsForTransition(ctx context.Context, olderThan time.Time) ([]models.Vessel, error) {
	if vesselDB == nil {
		return nil, fmt.Errorf("database is not initialized")
	}

	if err := ensureVesselsTable(ctx); err != nil {
		return nil, err
	}

	rows, err := vesselDB.QueryContext(ctx, `
		SELECT mmsi, name, length, draft, status, latitude, longitude, speed, heading, timestamp, shipping_agent_id, shipping_agent_email
		FROM vessels
		WHERE status = 'docked' AND timestamp <= $1
	`, olderThan.Unix())
	if err != nil {
		return nil, err
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
			&vessel.ShippingAgentID,
			&vessel.ShippingAgentEmail,
		); err != nil {
			return nil, err
		}
		vessels = append(vessels, vessel)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return vessels, nil
}

func updateVesselStatusAndEmitEvent(ctx context.Context, vessel models.Vessel, status string, rng *rand.Rand) error {
	if vesselDB == nil {
		return fmt.Errorf("database is not initialized")
	}

	now := time.Now().Unix()
	result, err := vesselDB.ExecContext(ctx, `
		UPDATE vessels
		SET status = $2,
		    timestamp = $3
		WHERE mmsi = $1
	`, vessel.MMSI, status, now)
	if err != nil {
		return err
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return fmt.Errorf("vessel %s not found", vessel.MMSI)
	}

	if kafkaProducer == nil {
		return nil
	}

	switch status {
	case "departed":
		departedEvent := infrastructure.VesselDepartedEvent{
			VesselID:           vessel.MMSI,
			Timestamp:          now,
			Latitude:           vessel.Latitude,
			Longitude:          vessel.Longitude,
			VesselName:         vessel.Name,
			ShippingAgentEmail: vessel.ShippingAgentEmail,
		}
		if err := kafkaProducer.EmitVesselDeparted(ctx, vessel.MMSI, departedEvent); err != nil {
			return err
		}
	case "overstayed":
		overstayHours := float64(now-vessel.Timestamp) / 3600.0
		if overstayHours < 0 {
			overstayHours = 0
		}
		overstayedEvent := infrastructure.VesselOverstayedEvent{
			VesselID:           vessel.MMSI,
			Timestamp:          now,
			CheckoutTime:       vessel.Timestamp,
			OverstayHours:      overstayHours,
			VesselName:         vessel.Name,
			ShippingAgentEmail: vessel.ShippingAgentEmail,
		}
		if err := kafkaProducer.EmitVesselOverstayed(ctx, vessel.MMSI, overstayedEvent); err != nil {
			return err
		}
	default:
		return fmt.Errorf("unsupported transition status %q", status)
	}

	return nil
}

// StartDockedStatusTransitionScheduler randomly flips docked vessels to departed or overstayed
// after they have remained docked for the configured delay.
func StartDockedStatusTransitionScheduler() {
	transitionDelayMinutes := envIntOrDefault("DOCKED_STATUS_DELAY_MINUTES", 5)
	checkIntervalMinutes := envIntOrDefault("DOCKED_STATUS_CHECK_MINUTES", 1)

	transitionDelay := time.Duration(transitionDelayMinutes) * time.Minute
	checkInterval := time.Duration(checkIntervalMinutes) * time.Minute

	go func() {
		ticker := time.NewTicker(checkInterval)
		defer ticker.Stop()

		rng := rand.New(rand.NewSource(time.Now().UnixNano()))

		for range ticker.C {
			ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
			vessels, err := findDockedVesselsForTransition(ctx, time.Now().Add(-transitionDelay))
			if err != nil {
				log.Printf("[docked-transition] failed to load docked vessels: %v", err)
				cancel()
				continue
			}

			for _, vessel := range vessels {
				status := "departed"
				if rng.Intn(2) == 0 {
					status = "overstayed"
				}

				if err := updateVesselStatusAndEmitEvent(ctx, vessel, status, rng); err != nil {
					log.Printf("[docked-transition] vessel %s -> %s failed: %v", vessel.MMSI, status, err)
					continue
				}

				log.Printf("[docked-transition] vessel %s -> %s", vessel.MMSI, status)
			}

			cancel()
		}
	}()

	log.Printf("[docked-transition] scheduler enabled: every %s after %s docked", checkInterval, transitionDelay)
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
