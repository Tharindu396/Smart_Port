package config

import (
	"os"
	"strconv"
	"strings"
)

type AISFeedConfig struct {
	Enabled      bool
	FeedType     string
	URL          string
	AuthKey      string
	PollInterval int
}

func InitAISFeed() *AISFeedConfig {
	enabled := strings.ToLower(os.Getenv("AIS_FEED_ENABLED")) == "true"
	feedType := os.Getenv("AIS_FEED_TYPE")
	if feedType == "" {
		feedType = "api"
	}

	url := os.Getenv("AIS_FEED_URL")
	authKey := os.Getenv("AIS_FEED_AUTH_KEY")

	pollInterval := 30
	if value := os.Getenv("AIS_FEED_POLL_INTERVAL"); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil {
			pollInterval = parsed
		}
	}

	return &AISFeedConfig{
		Enabled:      enabled,
		FeedType:     feedType,
		URL:          url,
		AuthKey:      authKey,
		PollInterval: pollInterval,
	}
}
