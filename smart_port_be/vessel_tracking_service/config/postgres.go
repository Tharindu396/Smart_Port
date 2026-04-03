// config/postgres.go
package config

import (
    "database/sql"
    "fmt"
    "log"
    "os"

    _ "github.com/lib/pq"
)

func InitPostgres() *sql.DB {
    dsn := fmt.Sprintf(
        "host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
        os.Getenv("DB_HOST"),
        os.Getenv("DB_PORT"),
        os.Getenv("DB_USER"),
        os.Getenv("DB_PASSWORD"),
        os.Getenv("DB_NAME"),
        os.Getenv("DB_SSLMODE"),
    )

    db, err := sql.Open("postgres", dsn)
    if err != nil {
        log.Fatal("Failed to connect to DB:", err)
    }

    err = db.Ping()
    if err != nil {
        log.Fatal("DB not reachable:", err)
    }

    fmt.Println("✅ Connected to PostgreSQL")

    return db
}