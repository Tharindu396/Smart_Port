package platform

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
	"smartport/berthing-service/config"
)

// InitNeo4j establishes a connection and verifies it is alive
func InitNeo4j(cfg *config.Config) (neo4j.DriverWithContext, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	driver, err := neo4j.NewDriverWithContext(
		cfg.Neo4jURI,
		neo4j.BasicAuth(cfg.Neo4jUser, cfg.Neo4jPass, ""),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create neo4j driver: %w", err)
	}

	// Verify the connection (High Availability Requirement)
	err = driver.VerifyConnectivity(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to neo4j: %w", err)
	}

	log.Println("✅ Neo4j Connection Established and Verified")
	return driver, nil
}