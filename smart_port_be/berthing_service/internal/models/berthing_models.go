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
	AllocatedBy    string    `json:"allocated_by,omitempty"`
}

// Slot represents a single unit of space in a Berth or Yard
type Slot struct {
	ID          string  `json:"id"`
	Type        string  `json:"type"` // "BERTH" or "YARD"
	IsOccupied  bool    `json:"is_occupied"`
	Depth       float64 `json:"depth"`  // Only relevant for BERTH type
	Status      string  `json:"status"` // AVAILABLE, PENDING_PAYMENT, OCCUPIED
	ReservedBy  string  `json:"reserved_by,omitempty"`
	MaxCapacity int     `json:"max_capacity"` // Max stacking height for YARD slots
	CurrentLoad int     `json:"current_load"` // How many containers are currently there
}

// Container represents a unit for the Dependency Resolution (FR-2.2)
type Container struct {
	ID            string `json:"id"`
	Weight        int    `json:"weight"`
	MovesRequired int    `json:"moves_required"` // Calculated by the engine
	SlotID        string `json:"slot_id"`        // The Slot it is currently in (Location)
}

// AllocationHistoryEntry is a lightweight audit record for berth allocations.
type AllocationHistoryEntry struct {
	VesselID    string   `json:"vessel_id"`
	VesselName  string   `json:"vessel_name"`
	AllocatedBy string   `json:"allocated_by"`
	AllocatedAt string   `json:"allocated_at"`
	SlotIDs     []string `json:"slot_ids"`
}
