package config

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	aisstream "github.com/aisstream/ais-message-models/golang/aisStream"
	"github.com/gorilla/websocket"

	"go-server/models"
)

const defaultAISStreamURL = "wss://stream.aisstream.io/v0/stream"

type AISStreamConfig struct {
	URL          string
	APIKey       string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	BoundingBox  [][][]float64
}

type AISStreamClient struct {
	config AISStreamConfig
	conn   *websocket.Conn
}

type positionReport struct {
	UserID      int64   `json:"UserID"`
	Latitude    float64 `json:"Latitude"`
	Longitude   float64 `json:"Longitude"`
	Sog         float64 `json:"Sog"`
	Cog         float64 `json:"Cog"`
	TrueHeading float64 `json:"TrueHeading"`
}

func LoadAISStreamConfigFromEnv() (AISStreamConfig, error) {
	url := strings.TrimSpace(os.Getenv("AIS_URL"))
	if url == "" {
		url = defaultAISStreamURL
	}

	apiKey := strings.TrimSpace(os.Getenv("AIS_API_KEY"))
	if apiKey == "" {
		return AISStreamConfig{}, errors.New("AIS_API_KEY is required")
	}

	readTimeout := 45 * time.Second
	if value := strings.TrimSpace(os.Getenv("AIS_READ_TIMEOUT_SEC")); value != "" {
		sec, err := strconv.Atoi(value)
		if err != nil || sec <= 0 {
			return AISStreamConfig{}, fmt.Errorf("invalid AIS_READ_TIMEOUT_SEC: %q", value)
		}
		readTimeout = time.Duration(sec) * time.Second
	}

	writeTimeout := 10 * time.Second
	if value := strings.TrimSpace(os.Getenv("AIS_WRITE_TIMEOUT_SEC")); value != "" {
		sec, err := strconv.Atoi(value)
		if err != nil || sec <= 0 {
			return AISStreamConfig{}, fmt.Errorf("invalid AIS_WRITE_TIMEOUT_SEC: %q", value)
		}
		writeTimeout = time.Duration(sec) * time.Second
	}

	bbox := [][][]float64{{{-90.0, -180.0}, {90.0, 180.0}}}
	if value := strings.TrimSpace(os.Getenv("AIS_BBOX")); value != "" {
		parsed, err := parseBoundingBox(value)
		if err != nil {
			return AISStreamConfig{}, err
		}
		bbox = parsed
	}

	return AISStreamConfig{
		URL:          url,
		APIKey:       apiKey,
		ReadTimeout:  readTimeout,
		WriteTimeout: writeTimeout,
		BoundingBox:  bbox,
	}, nil
}

func NewAISStreamClient(cfg AISStreamConfig) *AISStreamClient {
	return &AISStreamClient{config: cfg}
}

func (c *AISStreamClient) Connect(ctx context.Context) error {
	ws, _, err := websocket.DefaultDialer.DialContext(ctx, c.config.URL, nil)
	if err != nil {
		return err
	}

	c.conn = ws
	c.conn.SetReadDeadline(time.Now().Add(c.config.ReadTimeout))

	subMsg := aisstream.SubscriptionMessage{
		APIKey:        c.config.APIKey,
		BoundingBoxes: c.config.BoundingBox,
	}

	payload, err := json.Marshal(subMsg)
	if err != nil {
		_ = c.conn.Close()
		c.conn = nil
		return err
	}

	_ = c.conn.SetWriteDeadline(time.Now().Add(c.config.WriteTimeout))
	if err := c.conn.WriteMessage(websocket.TextMessage, payload); err != nil {
		_ = c.conn.Close()
		c.conn = nil
		return err
	}

	return nil
}

func (c *AISStreamClient) Close() error {
	if c.conn == nil {
		return nil
	}
	err := c.conn.Close()
	c.conn = nil
	return err
}

func (c *AISStreamClient) ReadVessel() (*models.Vessel, error) {
	if c.conn == nil {
		return nil, errors.New("AISStream websocket is not connected")
	}

	for {
		_ = c.conn.SetReadDeadline(time.Now().Add(c.config.ReadTimeout))
		_, payload, err := c.conn.ReadMessage()
		if err != nil {
			return nil, err
		}

		var packet aisstream.AisStreamMessage
		if err := json.Unmarshal(payload, &packet); err != nil {
			continue
		}

		if packet.MessageType != aisstream.POSITION_REPORT || packet.Message.PositionReport == nil {
			continue
		}

		reportBytes, err := json.Marshal(packet.Message.PositionReport)
		if err != nil {
			continue
		}

		var report positionReport
		if err := json.Unmarshal(reportBytes, &report); err != nil {
			continue
		}

		if report.UserID == 0 {
			continue
		}

		shipName := ""
		if packet.MetaData != nil {
			if name, ok := packet.MetaData["ShipName"]; ok {
				if n, castOk := name.(string); castOk {
					shipName = n
				}
			}
		}

		vessel := &models.Vessel{
			MMSI:      strconv.FormatInt(report.UserID, 10),
			Name:      shipName,
			Latitude:  report.Latitude,
			Longitude: report.Longitude,
			Speed:     report.Sog,
			Heading:   report.TrueHeading,
			Timestamp: time.Now().Unix(),
		}

		return vessel, nil
	}
}

func parseBoundingBox(value string) ([][][]float64, error) {
	parts := strings.Split(value, ",")
	if len(parts) != 4 {
		return nil, errors.New("AIS_BBOX must be in format: minLat,minLon,maxLat,maxLon")
	}

	coords := make([]float64, 4)
	for i, part := range parts {
		num, err := strconv.ParseFloat(strings.TrimSpace(part), 64)
		if err != nil {
			return nil, fmt.Errorf("invalid AIS_BBOX value %q", part)
		}
		coords[i] = num
	}

	if coords[0] >= coords[2] || coords[1] >= coords[3] {
		return nil, errors.New("AIS_BBOX must satisfy minLat < maxLat and minLon < maxLon")
	}

	return [][][]float64{{{coords[0], coords[1]}, {coords[2], coords[3]}}}, nil
}
