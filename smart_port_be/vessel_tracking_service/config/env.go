// config/env.go
package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func LoadEnv() {
	if _, err := os.Stat(".env"); err != nil {
		if os.IsNotExist(err) {
			return
		}

		log.Printf("Error checking .env file: %v", err)
		return
	}

	if err := godotenv.Load(); err != nil {
		log.Printf("Error loading .env file: %v", err)
	}
}
