package allocation

import (
	"context"
	"fmt"
	"smartport/berthing-service/internal/infrastructure"
	"smartport/berthing-service/internal/models"
)

// Service defines the business logic for allocation
type Service struct {
	repo     Repository
	producer *infrastructure.KafkaProducer
}

// NewService initializes the brain with a librarian (repo)
func NewService(repo Repository, producer *infrastructure.KafkaProducer) *Service {
	return &Service{
		repo:     repo,
		producer: producer,
	}
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
	allocatedBy := vessel.AllocatedBy
	if allocatedBy == "" {
		allocatedBy = "system"
	}

	err = s.repo.ReserveSlots(ctx, slots, vessel.ID, vessel.Name, allocatedBy, 30)
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

// CompleteAllocationByVessel finalizes the booking when payment is successful
func (s *Service) CompleteAllocationByVessel(ctx context.Context, vesselID string) error {
	// 1. We tell the repo to find all slots tagged with this vessel and make them OCCUPIED
	err := s.repo.ConfirmReservationByVessel(ctx, vesselID)
	if err != nil {
		return fmt.Errorf("failed to finalize allocation for %s: %v", vesselID, err)
	}
	return nil
}

// CancelAllocationByVessel is the Compensating Transaction for failed payments
func (s *Service) CancelAllocationByVessel(ctx context.Context, vesselID string) error {
	// 2. We release any PENDING locks held by this vessel
	err := s.repo.ReleaseSlotsByVessel(ctx, vesselID)
	if err != nil {
		return fmt.Errorf("failed to revert allocation for %s: %v", vesselID, err)
	}
	return nil
}

// GetAllSlots returns current slot state for berth overview dashboards.
func (s *Service) GetAllSlots(ctx context.Context) ([]models.Slot, error) {
	return s.repo.GetAllSlots(ctx)
}

// GetAllocationHistory returns latest allocation audit entries.
func (s *Service) GetAllocationHistory(ctx context.Context, limit int) ([]models.AllocationHistoryEntry, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	return s.repo.GetAllocationHistory(ctx, limit)
}
