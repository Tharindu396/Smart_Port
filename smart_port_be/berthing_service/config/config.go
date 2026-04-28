package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all the server and database settings
type Config struct {
	Neo4jURI   string
	Neo4jUser  string
	Neo4jPass  string
	ServerPort string
	KafkaBrokers string
}

// LoadConfig reads values from .env or environment variables
func LoadConfig() *Config {
	// We use _ because in a Docker/Cloud environment, the .env file might not exist, 
	// and we don't want the app to crash.
	
	_ = godotenv.Load("../.env")
	log.Println("Configuration successfully loaded...")

	return &Config{
		Neo4jURI:   getEnv("NEO4J_URI", "bolt://localhost:7687"),
		Neo4jUser:  getEnv("NEO4J_USER", "neo4j"),
		Neo4jPass:  getEnv("NEO4J_PASS", "password"),
		ServerPort: getEnv("PORT", "5003"),
		KafkaBrokers: getEnv("KAFKA_BROKERS", "localhost:9092"),
	}
}

// getEnv is a helper to allow default values if a variable isn't set
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}