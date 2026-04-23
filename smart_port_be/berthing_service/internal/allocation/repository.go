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
	ReserveSlots(ctx context.Context, slotIds []string, expiryMinutes int) error
	ConfirmReservation(ctx context.Context, slotIds []string) error
	CancelReservation(ctx context.Context, slotIds []string) error
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

	query := `MATCH (s:Slot) RETURN s.id, s.type, s.isOccupied, s.depth`
	result, err := session.Run(ctx, query, nil)
	if err != nil { return nil, err }

	var slots []models.Slot
	for result.Next(ctx) {
		record := result.Record()
		id, _ := record.Get("s.id")
		sType, _ := record.Get("s.type")
		isOcc, _ := record.Get("s.isOccupied")
		depth, _ := record.Get("s.depth")

		slots = append(slots, models.Slot{
			ID:         id.(string),
			Type:       sType.(string),
			IsOccupied: isOcc.(bool),
			Depth:      depth.(float64),
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

func (r *Neo4jRepository) ReserveSlots(ctx context.Context, slotIds []string, expiryMinutes int) error {
	session := r.Driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	// We use SET s.status and s.reservedUntil to handle the Phase 1 lock
	query := `
		MATCH (s:Slot) WHERE s.id IN $ids
		SET s.status = 'PENDING_PAYMENT', 
		    s.isOccupied = true,
		    s.reservedUntil = datetime() + duration({minutes: $expiry})
	`
	_, err := session.Run(ctx, query, map[string]interface{}{
		"ids":    slotIds,
		"expiry": expiryMinutes,
	})
	return err
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