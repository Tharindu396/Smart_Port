// internal/allocation/interfaces.go (or similar neutral package)
package allocation

import "context"
import "smartport/berthing-service/internal/models"

type AllocationService interface {
    AllocateBerth(ctx context.Context, vessel models.Vessel) ([]string, error)
    CompleteAllocationByVessel(ctx context.Context, vesselID string) error
    CancelAllocationByVessel(ctx context.Context, vesselID string) error
}