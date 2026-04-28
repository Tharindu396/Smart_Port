package models

import "time"

// Vessel represents a ship requesting a berth (internal domain model)
type Vessel struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	Length         int       `json:"length"`
	Draft          float64   `json:"draft"`
	ArrivalPlanned time.Time `json:"arrival_planned"`
	StayDuration   int       `json:"stay_duration"`
	AllocatedBy    string    `json:"allocated_by,omitempty"`
	AgentEmail     string    `json:"agent_email,omitempty"`
}

// Dimensions is the nested dimensions block inside VesselArrivalEvent.
type Dimensions struct {
	Length int     `json:"length"`
	Depth  float64 `json:"depth"`
}

// VesselArrivalEvent is the Kafka payload shape produced by the Logistics Service
// on the vessel.arrivals topic.
type VesselArrivalEvent struct {
	VisitID    string     `json:"visitId"`
	VesselID   string     `json:"vesselId"`
	VesselName string     `json:"vesselName"`
	AgentID    string     `json:"agentId"`
	Dimensions Dimensions `json:"dimensions"`
}

// ToVessel maps the Kafka event to the internal Vessel domain model.
func (e VesselArrivalEvent) ToVessel() Vessel {
	return Vessel{
		ID:          e.VisitID,
		Name:        e.VesselName,
		Length:      e.Dimensions.Length,
		Draft:       e.Dimensions.Depth,
		AllocatedBy: e.AgentID,
	}
}

// AllocationConfirmedEvent is published to allocation.confirmed on successful berth reservation.
// Field names match the Notification Service and Logistics Service consumer interfaces.
type AllocationConfirmedEvent struct {
	VisitID    string `json:"visitId"`
	VesselName string `json:"vesselName"`
	BerthID    string `json:"berthId"`
	BerthName  string `json:"berthName"`
	AgentEmail string `json:"shippingCompanyEmail"`
	LockExpiry string `json:"lockExpiry"` // RFC3339
}

// AllocationFailedEvent is published to allocation.failed when no berth can be reserved.
type AllocationFailedEvent struct {
	VisitID    string `json:"visitId"`
	VesselName string `json:"vesselName"`
	Reason     string `json:"reason"`
}

// Slot represents a single unit of space in a Berth or Yard
type Slot struct {
	ID          string  `json:"id"`
	Type        string  `json:"type"`
	IsOccupied  bool    `json:"is_occupied"`
	Depth       float64 `json:"depth"`
	Status      string  `json:"status"`
	ReservedBy  string  `json:"reserved_by,omitempty"`
	MaxCapacity int     `json:"max_capacity"`
	CurrentLoad int     `json:"current_load"`
}

// Container represents a unit for the Dependency Resolution (FR-2.2)
type Container struct {
	ID            string `json:"id"`
	Weight        int    `json:"weight"`
	MovesRequired int    `json:"moves_required"`
	SlotID        string `json:"slot_id"`
}

// AllocationHistoryEntry is a lightweight audit record for berth allocations.
type AllocationHistoryEntry struct {
	VesselID    string   `json:"vessel_id"`
	VesselName  string   `json:"vessel_name"`
	AllocatedBy string   `json:"allocated_by"`
	AllocatedAt string   `json:"allocated_at"`
	SlotIDs     []string `json:"slot_ids"`
}
