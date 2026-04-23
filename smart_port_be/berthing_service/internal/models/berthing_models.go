package models

import "time"

// Vessel represents a ship requesting a berth
type Vessel struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	Length         int       `json:"length"`          // Number of contiguous slots needed
	Draft          float64   `json:"draft"`           // Minimum water depth required
	ArrivalPlanned time.Time `json:"arrival_planned"` // Duration handling
	StayDuration   int       `json:"stay_duration"`   // Hours the ship will stay
}

// Slot represents a single unit of space in a Berth or Yard
type Slot struct {
	ID          string  `json:"id"`
	Type        string  `json:"type"`        // "BERTH" or "YARD"
	IsOccupied  bool    `json:"is_occupied"`
	Depth       float64 `json:"depth"`       // Only relevant for BERTH type
	MaxCapacity int     `json:"max_capacity"` // Max stacking height for YARD slots
	CurrentLoad int     `json:"current_load"`  // How many containers are currently there
}

// Container represents a unit for the Dependency Resolution (FR-2.2)
type Container struct {
	ID            string `json:"id"`
	Weight        int    `json:"weight"`
	MovesRequired int    `json:"moves_required"` // Calculated by the engine
	SlotID        string `json:"slot_id"`        // The Slot it is currently in (Location)
}