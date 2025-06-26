// Plant management system for multi-plant allocation
// Handles plant capacities, allocation logic, and capacity tracking

import { fetchPlantDataCached, getAllPlantIds, PlantData } from "./plantApi";
import { getPlantCapacityAllocations } from "./purchaseApi";

export interface Plant {
  id: string;
  name: string;
  location: string;
  totalCapacity: number; // Total kWp capacity (installed power)
  availableCapacity: number; // Remaining kWp capacity
  solarIndex: number;
  panelPower: number; // Watts per panel
  efficiency: number; // Percentage
  pricePerPanel: number; // USD
  networkFee: number; // USD
  status: "active" | "maintenance" | "full";
}

export interface PlantAllocation {
  plantId: string;
  plantName: string; // Added plant name field
  panels: number;
  capacity: number; // kWp allocated from this plant (installed power)
  cost: number; // Cost for this plant allocation
}

export interface Purchase {
  id: string;
  walletAddress: string;
  totalPanels: number;
  totalCapacity: number;
  totalCost: number;
  paymentMethod: string;
  signature: string;
  timestamp: string;
  plantAllocations: PlantAllocation[]; // Multi-plant allocation
}

// Panel specifications
export const PANEL_CAPACITY_KWP = 1.0; // 1 panel = 1 kWp each

// Convert PlantData from API to Plant interface with current allocations
const convertPlantDataToPlant = async (
  plantData: PlantData
): Promise<Plant> => {
  try {
    // Fetch current allocations for this plant
    const allocationsResponse = await getPlantCapacityAllocations(plantData.id);
    const allocatedCapacity =
      allocationsResponse?.data?.totalAllocatedCapacity || 0;
    const availableCapacity = Math.max(
      0,
      plantData.plantSize - allocatedCapacity
    );

    return {
      id: plantData.id,
      name: plantData.name,
      location: plantData.location || "Unknown",
      totalCapacity: plantData.plantSize, // Use dynamic plantSize from API
      availableCapacity,
      solarIndex: 5.0, // Default value (could come from API)
      panelPower: 1000, // Watts per panel (1 kWp = 1000W)
      efficiency: 98, // Default efficiency
      pricePerPanel: 1, // USD - could come from API
      networkFee: 0, // Default network fee
      status: availableCapacity > 0 ? "active" : "full",
    };
  } catch (error) {
    console.error(`Error converting plant data for ${plantData.id}:`, error);
    // Return with default available capacity if allocation fetch fails
    return {
      id: plantData.id,
      name: plantData.name,
      location: plantData.location || "Unknown",
      totalCapacity: plantData.plantSize,
      availableCapacity: plantData.plantSize, // Assume full capacity available
      solarIndex: 5.0,
      panelPower: 1000,
      efficiency: 98,
      pricePerPanel: 1,
      networkFee: 0,
      status: "active",
    };
  }
};

// Plant allocation logic - First Come First Serve
export class PlantAllocationService {
  // Get all plants with current capacity status
  static async getPlants(): Promise<Plant[]> {
    try {
      const plantIds = getAllPlantIds();
      const plantDataList = await Promise.all(
        plantIds.map((id) => fetchPlantDataCached(id))
      );

      // Convert plant data to plants with current allocations
      const plants = await Promise.all(
        plantDataList.map((plantData) => convertPlantDataToPlant(plantData))
      );

      return plants;
    } catch (error) {
      console.error("Error getting plants:", error);
      return [];
    }
  }

  // Get specific plant by ID
  static async getPlant(plantId: string): Promise<Plant | undefined> {
    try {
      const plantData = await fetchPlantDataCached(plantId);
      return await convertPlantDataToPlant(plantData);
    } catch (error) {
      console.error(`Error getting plant ${plantId}:`, error);
      return undefined;
    }
  }

  // Get total available capacity across all plants
  static async getTotalAvailableCapacity(): Promise<number> {
    const plants = await this.getPlants();
    return plants.reduce((total, plant) => {
      return plant.status === "active"
        ? total + plant.availableCapacity
        : total;
    }, 0);
  }

  // Calculate panel capacity in kWp (installed power)
  static calculatePanelCapacity(panels: number): number {
    // Use standard panel capacity of 1.0 kWp per panel
    return panels * PANEL_CAPACITY_KWP;
  }

  // Calculate required panels for desired capacity
  static calculateRequiredPanels(desiredCapacity: number): number {
    return Math.ceil(desiredCapacity / PANEL_CAPACITY_KWP);
  }

  // Allocate panels across plants using First Come First Serve
  static async allocatePanels(requestedPanels: number): Promise<{
    success: boolean;
    allocations: PlantAllocation[];
    totalCapacity: number;
    totalCost: number;
    error?: string;
  }> {
    try {
      const plants = await this.getPlants();
      const allocations: PlantAllocation[] = [];
      let remainingPanels = requestedPanels;
      let totalCapacity = 0;
      let totalCost = 0;

      // Check if we have enough total capacity
      const totalAvailableCapacity = plants.reduce((total, plant) => {
        return plant.status === "active"
          ? total + plant.availableCapacity
          : total;
      }, 0);
      const requiredCapacity = requestedPanels * PANEL_CAPACITY_KWP;

      if (requiredCapacity > totalAvailableCapacity) {
        return {
          success: false,
          allocations: [],
          totalCapacity: 0,
          totalCost: 0,
          error: `Insufficient capacity. Required: ${requiredCapacity.toFixed(
            2
          )} kWp, Available: ${totalAvailableCapacity.toFixed(2)} kWp`,
        };
      }

      // Sort plants by available capacity (descending) for first-come-first-serve
      const availablePlants = plants
        .filter(
          (plant) => plant.status === "active" && plant.availableCapacity > 0
        )
        .sort((a, b) => b.availableCapacity - a.availableCapacity);

      // Allocate panels using First Come First Serve
      for (const plant of availablePlants) {
        if (remainingPanels <= 0) break;

        // Calculate how many panels we can allocate from this plant
        const maxPanelsFromCapacity = Math.floor(
          plant.availableCapacity / PANEL_CAPACITY_KWP
        );
        const panelsToAllocate = Math.min(
          remainingPanels,
          maxPanelsFromCapacity
        );

        if (panelsToAllocate > 0) {
          const allocationCapacity = panelsToAllocate * PANEL_CAPACITY_KWP;
          const allocationCost = panelsToAllocate * plant.pricePerPanel;

          allocations.push({
            plantId: plant.id,
            plantName: plant.name,
            panels: panelsToAllocate,
            capacity: allocationCapacity,
            cost: allocationCost,
          });

          totalCapacity += allocationCapacity;
          totalCost += allocationCost;
          remainingPanels -= panelsToAllocate;
        }
      }

      if (remainingPanels > 0) {
        return {
          success: false,
          allocations: [],
          totalCapacity: 0,
          totalCost: 0,
          error: `Could not allocate all panels. ${remainingPanels} panels remaining.`,
        };
      }

      return {
        success: true,
        allocations,
        totalCapacity,
        totalCost,
      };
    } catch (error) {
      console.error("Error allocating panels:", error);
      return {
        success: false,
        allocations: [],
        totalCapacity: 0,
        totalCost: 0,
        error: "Error occurred during panel allocation.",
      };
    }
  }

  // Get maximum panels that can be allocated across all plants
  static async getMaximumPanels(): Promise<number> {
    const totalAvailableCapacity = await this.getTotalAvailableCapacity();
    return Math.floor(totalAvailableCapacity / PANEL_CAPACITY_KWP);
  }

  // Get user's allocations from all plants (placeholder - would fetch from backend)
  static async getUserAllocations(
    walletAddress: string
  ): Promise<PlantAllocation[]> {
    // This would typically fetch from backend API
    // For now, return from localStorage as example
    try {
      const purchases = this.getUserPurchases(walletAddress);
      return purchases.flatMap((purchase) => purchase.plantAllocations);
    } catch (error) {
      console.error("Error getting user allocations:", error);
      return [];
    }
  }

  // Get user's total allocation per plant
  static async getUserPlantSummary(walletAddress: string): Promise<{
    [plantId: string]: { panels: number; capacity: number; cost: number };
  }> {
    const allocations = await this.getUserAllocations(walletAddress);
    const summary: {
      [plantId: string]: { panels: number; capacity: number; cost: number };
    } = {};

    for (const allocation of allocations) {
      if (!summary[allocation.plantId]) {
        summary[allocation.plantId] = { panels: 0, capacity: 0, cost: 0 };
      }
      summary[allocation.plantId].panels += allocation.panels;
      summary[allocation.plantId].capacity += allocation.capacity;
      summary[allocation.plantId].cost += allocation.cost;
    }

    return summary;
  }

  // Get user purchases (mock implementation - replace with actual API)
  private static getUserPurchases(walletAddress: string): Purchase[] {
    try {
      const purchases = localStorage.getItem(`purchases_${walletAddress}`);
      return purchases ? JSON.parse(purchases) : [];
    } catch {
      return [];
    }
  }

  // Save purchase (mock implementation - replace with actual API)
  static savePurchase(purchase: Purchase): void {
    try {
      const existingPurchases = this.getUserPurchases(purchase.walletAddress);
      existingPurchases.push(purchase);
      localStorage.setItem(
        `purchases_${purchase.walletAddress}`,
        JSON.stringify(existingPurchases)
      );
    } catch (error) {
      console.error("Error saving purchase:", error);
    }
  }
}
