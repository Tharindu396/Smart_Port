package allocation

import (
	"context"
	"fmt"
	"time"
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

	// 1. Find contiguous slots matching the vessel's draft requirement
	slots, err := s.repo.FindContiguousSlots(ctx, requiredLength, vessel.Draft)
	if err != nil || len(slots) == 0 {
		reason := "no suitable berth available for the required dimensions"
		if emitErr := s.producer.EmitAllocationFailed(ctx, models.AllocationFailedEvent{
			VisitID: vessel.ID, VesselName: vessel.Name, Reason: reason,
		}); emitErr != nil {
			fmt.Printf("⚠️ Failed to emit allocation.failed for %s: %v\n", vessel.ID, emitErr)
		}
		return nil, fmt.Errorf("no suitable space found")
	}

	// 2. Place the 30-minute PENDING_PAYMENT lock on the chosen slots
	allocatedBy := vessel.AllocatedBy
	if allocatedBy == "" {
		allocatedBy = "system"
	}

	err = s.repo.ReserveSlots(ctx, slots, vessel.ID, vessel.Name, allocatedBy, 30)
	if err != nil {
		reason := fmt.Sprintf("failed to secure temporary lock: %v", err)
		if emitErr := s.producer.EmitAllocationFailed(ctx, models.AllocationFailedEvent{
			VisitID: vessel.ID, VesselName: vessel.Name, Reason: reason,
		}); emitErr != nil {
			fmt.Printf("⚠️ Failed to emit allocation.failed for %s: %v\n", vessel.ID, emitErr)
		}
		return nil, fmt.Errorf("failed to secure temporary lock: %v", err)
	}

	// 3. Notify Invoice Service so it can create a pending invoice
	if emitErr := s.producer.EmitBerthReserved(ctx, vessel.ID, slots); emitErr != nil {
		fmt.Printf("⚠️ Failed to emit berth-reservations for %s: %v\n", vessel.ID, emitErr)
	}

	// 4. Notify Notification Service + Logistics Service of the confirmed allocation
	lockExpiry := time.Now().UTC().Add(30 * time.Minute).Format(time.RFC3339)
	if emitErr := s.producer.EmitAllocationConfirmed(ctx, models.AllocationConfirmedEvent{
		VisitID:    vessel.ID,
		VesselName: vessel.Name,
		BerthID:    slots[0],
		BerthName:  "Berth " + slots[0],
		AgentEmail: vessel.AgentEmail,
		LockExpiry: lockExpiry,
	}); emitErr != nil {
		fmt.Printf("⚠️ Failed to emit allocation.confirmed for %s: %v\n", vessel.ID, emitErr)
	}

	return slots, nil
}

// ResolveDependencies handles FR-2.2 (Dependency Resolution)
func (s *Service) ResolveDependencies(ctx context.Context, containerID string) (int, error) {
	moves, err := s.repo.GetDependencyCount(ctx, containerID)
	if err != nil {
		return 0, fmt.Errorf("failed to resolve dependencies for %s: %v", containerID, err)
	}
	return moves, nil
}

func (s *Service) UpdateSlotDepth(ctx context.Context, slotID string, newDepth float64) error {
	return s.repo.UpdateSlotDepth(ctx, slotID, newDepth)
}

// CompleteAllocationByVessel finalizes the booking when payment is successful
func (s *Service) CompleteAllocationByVessel(ctx context.Context, vesselID string) error {
	err := s.repo.ConfirmReservationByVessel(ctx, vesselID)
	if err != nil {
		return fmt.Errorf("failed to finalize allocation for %s: %v", vesselID, err)
	}
	return nil
}

// CancelAllocationByVessel is the Compensating Transaction for failed payments
func (s *Service) CancelAllocationByVessel(ctx context.Context, vesselID string) error {
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
