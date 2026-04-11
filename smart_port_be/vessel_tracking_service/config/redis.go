package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

func InitRedis() *redis.Client {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		addr = "127.0.0.1:6379"
	}
	if strings.HasPrefix(addr, "localhost:") {
		addr = "127.0.0.1:" + strings.TrimPrefix(addr, "localhost:")
	}

	password := os.Getenv("REDIS_PASSWORD")
	db := 0
	if value := os.Getenv("REDIS_DB"); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil {
			log.Fatalf("invalid REDIS_DB value: %v", err)
		}
		db = parsed
	}

	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Fatalf("failed to connect to redis: %v", err)
	}

	fmt.Println("Connected to Redis")
	return client
}
