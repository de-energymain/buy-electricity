import Purchase from "../models/Purchase";
import { fetchPlantDataCached, getAllPlantIds } from "./plantApi";

export interface PlantCapacity {
  plantId: string;
  totalCapacity: number; // kWp - installed power capacity
  allocatedCapacity: number; // kWp already allocated
  availableCapacity: number; // kWp still available
  allocatedPanels: number; // Total panels allocated
}

export class PlantCapacityService {
  // Get current capacity status for a plant
  static async getPlantCapacity(plantId: string): Promise<PlantCapacity> {
    try {
      // Fetch plant data from external API to get plantSize
      const plantData = await fetchPlantDataCached(plantId);
      const totalCapacity = plantData.plantSize; // Use dynamic plantSize from API

      // Get all purchases for this plant
      const purchases = await Purchase.find({
        "plantAllocations.plantId": plantId,
      });

      let allocatedCapacity = 0;
      let allocatedPanels = 0;

      purchases.forEach((purchase) => {
        purchase.plantAllocations.forEach((allocation) => {
          if (allocation.plantId === plantId) {
            allocatedCapacity += allocation.capacity;
            allocatedPanels += allocation.panels;
          }
        });
      });

      const availableCapacity = Math.max(0, totalCapacity - allocatedCapacity);

      return {
        plantId,
        totalCapacity,
        allocatedCapacity,
        availableCapacity,
        allocatedPanels,
      };
    } catch (error) {
      console.error(`Error getting plant capacity for ${plantId}:`, error);
      throw error;
    }
  }

  // Get capacity status for all plants
  static async getAllPlantCapacities(): Promise<PlantCapacity[]> {
    const plantIds = getAllPlantIds(); // Get plant IDs from plant API service
    const capacities = await Promise.all(
      plantIds.map((plantId) => this.getPlantCapacity(plantId))
    );
    return capacities;
  }

  // Check if a plant has enough available capacity
  static async checkAvailableCapacity(
    plantId: string,
    requestedCapacity: number
  ): Promise<boolean> {
    const capacity = await this.getPlantCapacity(plantId);
    return capacity.availableCapacity >= requestedCapacity;
  }

  // Get optimal allocation across plants (first-come-first-serve)
  static async getOptimalAllocation(
    requestedPanels: number,
    panelCapacity: number = 1.0 // 1 panel = 1 kWp each
  ): Promise<
    {
      plantId: string;
      panels: number;
      capacity: number;
    }[]
  > {
    const requestedCapacity = requestedPanels * panelCapacity;
    const allCapacities = await this.getAllPlantCapacities();

    // Sort by available capacity (descending) for first-come-first-serve
    const availablePlants = allCapacities
      .filter((plant) => plant.availableCapacity > 0)
      .sort((a, b) => b.availableCapacity - a.availableCapacity);

    const allocations: { plantId: string; panels: number; capacity: number }[] =
      [];
    let remainingCapacity = requestedCapacity;
    let remainingPanels = requestedPanels;

    for (const plant of availablePlants) {
      if (remainingCapacity <= 0) break;

      const allocatedCapacity = Math.min(
        remainingCapacity,
        plant.availableCapacity
      );
      const allocatedPanels = Math.min(
        remainingPanels,
        Math.floor(allocatedCapacity / panelCapacity)
      );

      if (allocatedPanels > 0) {
        allocations.push({
          plantId: plant.plantId,
          panels: allocatedPanels,
          capacity: allocatedCapacity,
        });

        remainingCapacity -= allocatedCapacity;
        remainingPanels -= allocatedPanels;
      }
    }

    return allocations;
  }

  // Reserve capacity for a purchase (to be called before saving purchase)
  static async reserveCapacity(
    allocations: { plantId: string; capacity: number }[]
  ): Promise<boolean> {
    try {
      // Check if all allocations are still available
      for (const allocation of allocations) {
        const available = await this.checkAvailableCapacity(
          allocation.plantId,
          allocation.capacity
        );
        if (!available) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error("Error reserving capacity:", error);
      return false;
    }
  }
}
