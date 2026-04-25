package routes

import (
	"github.com/gin-gonic/gin"
	"smartport/berthing-service/internal/handlers"
)

func SetupRoutes(r *gin.Engine, handler *handlers.AllocationHandler) {
	api := r.Group("/api/v1")
	{
		// --- FR-2.1: Berthing Endpoints ---
		api.POST("/allocate-berth", handler.PostBerthAllocation)
		api.GET("/berths/slots", handler.GetSlotsOverview)
		api.GET("/allocations/history", handler.GetAllocationHistory)

		// --- FR-2.2: Container Endpoints ---
		api.GET("/container/:id/dependency", handler.GetContainerDependency)

		// Inside SetupRoutes function
		api.POST("/payments/confirm", handler.ConfirmPayment)
		api.POST("/payments/cancel", handler.CancelAllocation)

		// --- Infrastructure Management (Admin/Berth Planner) ---
		// Use PUT to update existing slot limitations (e.g., dredging)
		api.PUT("/admin/slots/:id", handler.UpdateSlot)

		// You can also add the CreateSlot here if you've added the handler for it
		// api.POST("/admin/slots", handler.CreateSlot)
	}
}
