package allocation

import (
	"context"
	"fmt"
	"smartport/berthing-service/internal/models"
)

// Service defines the business logic for allocation
type Service struct {
	repo Repository
}

// NewService initializes the brain with a librarian (repo)
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// AllocateBerth handles FR-2.1 (Space Optimization)
func (s *Service) AllocateBerth(ctx context.Context, vessel models.Vessel) ([]string, error) {
	requiredLength := vessel.Length + 1
	
	// 1. Find the slots (Existing logic)
	slots, err := s.repo.FindContiguousSlots(ctx, requiredLength, vessel.Draft)
	if err != nil || len(slots) == 0 {
		return nil, fmt.Errorf("no suitable space found")
	}

	// 2. Database Change: Place the Temporary Lock (Phase 1 Requirement)
	err = s.repo.ReserveSlots(ctx, slots, 30) 
	if err != nil {
		return nil, fmt.Errorf("failed to secure temporary lock: %v", err)
	}

	return slots, nil
}

// ResolveDependencies handles FR-2.2 (Dependency Resolution)
func (s *Service) ResolveDependencies(ctx context.Context, containerID string) (int, error) {
	// Call the Repo to get the count from the graph
	moves, err := s.repo.GetDependencyCount(ctx, containerID)
	if err != nil {
		return 0, fmt.Errorf("failed to resolve dependencies for %s: %v", containerID, err)
	}

	return moves, nil
}

// internal/allocation/service.go

// Add this to your existing Service methods
func (s *Service) UpdateSlotDepth(ctx context.Context, slotID string, newDepth float64) error {
	// You can add business logic here later (e.g., "cannot change depth if a ship is parked")
	return s.repo.UpdateSlotDepth(ctx, slotID, newDepth)
}

// CompleteAllocation handles the "Commit" phase of our Saga pattern
func (s *Service) CompleteAllocation(ctx context.Context, slotIds []string) error {
    // Business Rule: You could add validation here to check if slots are 
    // actually in PENDING_PAYMENT status before confirming.
    
    err := s.repo.ConfirmReservation(ctx, slotIds)
    if err != nil {
        return fmt.Errorf("failed to finalize berth occupancy: %v", err)
    }
    return nil
}

// CancelAllocation handles the "Undo" (Compensating Transaction) if payment fails
func (s *Service) CancelAllocation(ctx context.Context, slotIds []string) error {
    // Business Logic: You could check if the slots are currently in 'PENDING_PAYMENT' 
    // before allowing a cancellation.
    
    err := s.repo.CancelReservation(ctx, slotIds)
    if err != nil {
        return fmt.Errorf("failed to revert berth lock: %v", err)
    }
    
    // In the future, you might emit a Kafka event here too: "berth.lock_released"
    return nil
}