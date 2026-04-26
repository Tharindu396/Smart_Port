package allocation

import (
	"context"
	"smartport/berthing-service/internal/models"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

// Repository interface defines what our database can do
// internal/allocation/repository.go

type Repository interface {
	FindContiguousSlots(ctx context.Context, length int, draft float64) ([]string, error)
	GetAllSlots(ctx context.Context) ([]models.Slot, error)
	UpdateSlotDepth(ctx context.Context, slotID string, newDepth float64) error
	CreateNewSlot(ctx context.Context, slot models.Slot) error
	GetDependencyCount(ctx context.Context, containerID string) (int, error)
	ReserveSlots(ctx context.Context, slotIds []string, vesselID string, vesselName string, allocatedBy string, expiryMinutes int) error
	ConfirmReservation(ctx context.Context, slotIds []string) error
	CancelReservation(ctx context.Context, slotIds []string) error
	ConfirmReservationByVessel(ctx context.Context, vesselID string) error
	ReleaseSlotsByVessel(ctx context.Context, vesselID string) error
	GetAllocationHistory(ctx context.Context, limit int) ([]models.AllocationHistoryEntry, error)
}

// Neo4jRepository is the actual implementation
type Neo4jRepository struct {
	Driver neo4j.DriverWithContext
}

func NewNeo4jRepository(driver neo4j.DriverWithContext) *Neo4jRepository {
	return &Neo4jRepository{Driver: driver}
}

// FR-2.2: Identify how many containers are on top of the target
func (r *Neo4jRepository) GetDependencyCount(ctx context.Context, containerID string) (int, error) {
	session := r.Driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	query := `
		MATCH (target:Container {id: $id})<-[:STACKED_ON*]-(blocker:Container)
		RETURN count(blocker) AS moves
	`

	result, err := session.Run(ctx, query, map[string]interface{}{"id": containerID})
	if err != nil {
		return 0, err
	}

	if result.Next(ctx) {
		record := result.Record()
		count, _ := record.Get("moves")
		return int(count.(int64)), nil
	}

	return 0, nil
}

// FR-2.1: Find contiguous empty slots of a certain length and water depth
func (r *Neo4jRepository) FindContiguousSlots(ctx context.Context, requiredLength int, minDepth float64) ([]string, error) {
	session := r.Driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	// The logic: A slot is available if (NOT occupied) OR (PENDING but EXPIRED).
	// We must NEVER touch 'OCCUPIED' slots regardless of time.
	query := `
        MATCH p = (start:Slot)-[:ADJACENT_TO*]->(end:Slot)
        WHERE length(p) = $requiredLength - 1
          AND ALL(n IN nodes(p) WHERE 
                n.depth >= $minDepth AND (
                    n.isOccupied = false OR 
                    (n.status = 'PENDING_PAYMENT' AND n.reservedUntil < datetime())
                )
          )
        RETURN [n IN nodes(p) | n.id] AS slotIds
        LIMIT 1
    `

	result, err := session.Run(ctx, query, map[string]interface{}{
		"requiredLength": requiredLength,
		"minDepth":       minDepth,
	})
	if err != nil {
		return nil, err
	}

	if result.Next(ctx) {
		record := result.Record()
		ids, _ := record.Get("slotIds")

		interfaceSlice := ids.([]interface{})
		stringSlice := make([]string, len(interfaceSlice))
		for i, v := range interfaceSlice {
			stringSlice[i] = v.(string)
		}
		return stringSlice, nil
	}

	return nil, nil
}

// GetAllSlots returns the current state of the port for the dashboard
func (r *Neo4jRepository) GetAllSlots(ctx context.Context) ([]models.Slot, error) {
	session := r.Driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	query := `
		MATCH (s:Slot)
		RETURN
			s.id AS id,
			s.type AS type,
			coalesce(s.isOccupied, false) AS isOccupied,
			coalesce(s.depth, 0.0) AS depth,
			coalesce(s.status, 'AVAILABLE') AS status,
			coalesce(s.reservedBy, '') AS reservedBy
		ORDER BY s.id
	`
	result, err := session.Run(ctx, query, nil)
	if err != nil {
		return nil, err
	}

	var slots []models.Slot
	for result.Next(ctx) {
		record := result.Record()
		id, _ := record.Get("id")
		sType, _ := record.Get("type")
		isOcc, _ := record.Get("isOccupied")
		depth, _ := record.Get("depth")
		status, _ := record.Get("status")
		reservedBy, _ := record.Get("reservedBy")

		slots = append(slots, models.Slot{
			ID:         id.(string),
			Type:       sType.(string),
			IsOccupied: isOcc.(bool),
			Depth:      depth.(float64),
			Status:     status.(string),
			ReservedBy: reservedBy.(string),
		})
	}
	return slots, nil
}

// UpdateSlotDepth allows admin to change physical limitations (Dredging)
func (r *Neo4jRepository) UpdateSlotDepth(ctx context.Context, slotID string, newDepth float64) error {
	session := r.Driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	query := `MATCH (s:Slot {id: $id}) SET s.depth = $depth RETURN s`
	_, err := session.Run(ctx, query, map[string]interface{}{
		"id":    slotID,
		"depth": newDepth,
	})
	return err
}

// CreateNewSlot allows expanding the port infrastructure
func (r *Neo4jRepository) CreateNewSlot(ctx context.Context, slot models.Slot) error {
	session := r.Driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	query := `CREATE (s:Slot {id: $id, type: $type, depth: $depth, isOccupied: false})`
	_, err := session.Run(ctx, query, map[string]interface{}{
		"id":    slot.ID,
		"type":  slot.Type,
		"depth": slot.Depth,
	})
	return err
}

func (r *Neo4jRepository) ReserveSlots(ctx context.Context, slotIds []string, vesselID string, vesselName string, allocatedBy string, expiryMinutes int) error {
	session := r.Driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	// We use SET s.status and s.reservedUntil to handle the Phase 1 lock
	query := `
		MATCH (s:Slot) WHERE s.id IN $ids
		SET s.status = 'PENDING_PAYMENT', 
		    s.isOccupied = true,
		    s.reservedBy = $vesselID,
		    s.reservedUntil = datetime() + duration({minutes: $expiry})
		CREATE (e:AllocationEvent {
			vesselID: $vesselID,
			vesselName: $vesselName,
			allocatedBy: $allocatedBy,
			slotIDs: $ids,
			allocatedAt: datetime()
		})
	`
	_, err := session.Run(ctx, query, map[string]interface{}{
		"ids":         slotIds,
		"vesselID":    vesselID,
		"vesselName":  vesselName,
		"allocatedBy": allocatedBy,
		"expiry":      expiryMinutes,
	})
	return err
}

func (r *Neo4jRepository) GetAllocationHistory(ctx context.Context, limit int) ([]models.AllocationHistoryEntry, error) {
	session := r.Driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	query := `
		MATCH (e:AllocationEvent)
		RETURN
			coalesce(e.vesselID, '') AS vesselID,
			coalesce(e.vesselName, '') AS vesselName,
			coalesce(e.allocatedBy, 'system') AS allocatedBy,
			toString(e.allocatedAt) AS allocatedAt,
			coalesce(e.slotIDs, []) AS slotIDs
		ORDER BY e.allocatedAt DESC
		LIMIT $limit
	`

	result, err := session.Run(ctx, query, map[string]interface{}{"limit": limit})
	if err != nil {
		return nil, err
	}

	history := make([]models.AllocationHistoryEntry, 0)
	for result.Next(ctx) {
		record := result.Record()
		vesselID, _ := record.Get("vesselID")
		vesselName, _ := record.Get("vesselName")
		allocatedBy, _ := record.Get("allocatedBy")
		allocatedAt, _ := record.Get("allocatedAt")
		slotIDsRaw, _ := record.Get("slotIDs")

		slotIDs := make([]string, 0)
		if values, ok := slotIDsRaw.([]interface{}); ok {
			slotIDs = make([]string, 0, len(values))
			for _, value := range values {
				if id, ok := value.(string); ok {
					slotIDs = append(slotIDs, id)
				}
			}
		}

		history = append(history, models.AllocationHistoryEntry{
			VesselID:    vesselID.(string),
			VesselName:  vesselName.(string),
			AllocatedBy: allocatedBy.(string),
			AllocatedAt: allocatedAt.(string),
			SlotIDs:     slotIDs,
		})
	}

	return history, nil
}

// internal/allocation/repository.go

// ConfirmReservation updates slots to a permanent occupied state after payment
func (r *Neo4jRepository) ConfirmReservation(ctx context.Context, slotIds []string) error {
	session := r.Driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	// Cypher logic: Match the pending slots and make them permanently occupied
	query := `
        MATCH (s:Slot) WHERE s.id IN $ids
        SET s.status = 'OCCUPIED', 
            s.isOccupied = true,
            s.reservedUntil = null
        RETURN s.id
    `
	_, err := session.Run(ctx, query, map[string]interface{}{
		"ids": slotIds,
	})
	return err
}

// CancelReservation is the "Compensating Transaction" for a failed payment
func (r *Neo4jRepository) CancelReservation(ctx context.Context, slotIds []string) error {
	session := r.Driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	// Resetting the slots to their original free state
	query := `
        MATCH (s:Slot) WHERE s.id IN $ids
        SET s.status = 'AVAILABLE', 
            s.isOccupied = false,
            s.reservedUntil = null
    `
	_, err := session.Run(ctx, query, map[string]interface{}{"ids": slotIds})
	return err
}

func (r *Neo4jRepository) ConfirmReservationByVessel(ctx context.Context, vesselID string) error {
	session := r.Driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	query := `
		MATCH (s:Slot {reservedBy: $vesselID, status: 'PENDING_PAYMENT'})
		SET s.status = 'OCCUPIED', 
		    s.isOccupied = true,
		    s.reservedUntil = null
	`
	_, err := session.Run(ctx, query, map[string]interface{}{"vesselID": vesselID})
	return err
}

func (r *Neo4jRepository) ReleaseSlotsByVessel(ctx context.Context, vesselID string) error {
	session := r.Driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	query := `
		MATCH (s:Slot {reservedBy: $vesselID})
		SET s.status = 'AVAILABLE', 
		    s.isOccupied = false, 
		    s.reservedBy = null, 
		    s.reservedUntil = null
	`
	_, err := session.Run(ctx, query, map[string]interface{}{"vesselID": vesselID})
	return err
}
