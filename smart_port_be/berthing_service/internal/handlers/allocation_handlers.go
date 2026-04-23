package handlers

import (
	"net/http"
	"smartport/berthing-service/internal/allocation"
	"smartport/berthing-service/internal/models"
	"github.com/gin-gonic/gin" // We use Gin for fast, professional routing
)

type AllocationHandler struct {
	service *allocation.Service
}

func NewAllocationHandler(service *allocation.Service) *AllocationHandler {
	return &AllocationHandler{service: service}
}

// PostBerthAllocation handles FR-2.1
func (h *AllocationHandler) PostBerthAllocation(c *gin.Context) {
	var vessel models.Vessel
	// 1. Validate the incoming JSON data
	if err := c.ShouldBindJSON(&vessel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vessel data provided"})
		return
	}

	// 2. Ask the Service to find a spot
	slots, err := h.service.AllocateBerth(c.Request.Context(), vessel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 3. Return the result
	c.JSON(http.StatusOK, gin.H{
		"message": "Optimal berth found",
		"vessel":  vessel.Name,
		"assigned_slots": slots,
	})
}

// GetContainerDependency handles FR-2.2
func (h *AllocationHandler) GetContainerDependency(c *gin.Context) {
	containerID := c.Param("id")

	moves, err := h.service.ResolveDependencies(c.Request.Context(), containerID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"container_id":   containerID,
		"moves_required": moves,
	})
}

// UpdateSlot handles PUT /api/v1/admin/slots/:id
func (h *AllocationHandler) UpdateSlot(c *gin.Context) {
	slotID := c.Param("id")
	var input struct {
		Depth float64 `json:"depth"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	err := h.service.UpdateSlotDepth(c.Request.Context(), slotID, input.Depth)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Slot depth updated successfully"})
}

// ConfirmPayment handles POST /api/v1/payments/confirm
func (h *AllocationHandler) ConfirmPayment(c *gin.Context) {
    var input struct {
        SlotIDs []string `json:"slot_ids"`
    }
    
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid slot IDs"})
        return
    }

    err := h.service.CompleteAllocation(c.Request.Context(), input.SlotIDs)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Payment confirmed, berth is now permanently occupied"})
}
// CancelAllocation handles POST /api/v1/payments/cancel
func (h *AllocationHandler) CancelAllocation(c *gin.Context) {
    var input struct {
        SlotIDs []string `json:"slot_ids"`
    }
    
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
        return
    }

    // Call service to unlock the slots
    err := h.service.CancelAllocation(c.Request.Context(), input.SlotIDs)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Allocation reversed successfully"})
}