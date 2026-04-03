// models/vessel.go
package models

type Vessel struct {
	MMSI      string  `json:"mmsi"`
	Name      string  `json:"name"`
	Length    float64 `json:"length"`
	Draft     float64 `json:"draft"`
	Status    string  `json:"status"`
	Latitude  float64 `json:"lat"`
	Longitude float64 `json:"lng"`
	Speed     float64 `json:"speed"`
	Heading   float64 `json:"heading"`
	Timestamp int64   `json:"timestamp"`
}
