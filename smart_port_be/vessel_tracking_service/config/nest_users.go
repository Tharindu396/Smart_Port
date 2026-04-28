package config

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

func InitNestUsersPostgres() (*sql.DB, error) {
	if os.Getenv("NEST_DB_HOST") == "" || os.Getenv("NEST_DB_USER") == "" || os.Getenv("NEST_DB_NAME") == "" {
		return nil, fmt.Errorf("nest users database env vars are not configured")
	}

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		os.Getenv("NEST_DB_HOST"),
		os.Getenv("NEST_DB_PORT"),
		os.Getenv("NEST_DB_USER"),
		os.Getenv("NEST_DB_PASSWORD"),
		os.Getenv("NEST_DB_NAME"),
		os.Getenv("NEST_DB_SSLMODE"),
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, err
	}

	return db, nil
}
